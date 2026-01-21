using System.IO.Compression;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Infrastructure.Services;

/// <summary>
/// Service for validating ZIP archives and preventing security issues like ZIP bombs.
/// </summary>
public sealed class ZipValidationService : IZipValidationService
{
    public async Task<(List<string> Files, long UncompressedSize)> ValidateAndExtractMetadataAsync(
        Stream stream,
        CancellationToken cancellationToken = default)
    {
        var containedFiles = new List<string>();
        long totalUncompressedSize = 0;

        try
        {
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);

            foreach (var entry in archive.Entries)
            {
                // Skip directories
                if (string.IsNullOrEmpty(entry.Name))
                    continue;

                // Get file extension
                var extension = Path.GetExtension(entry.FullName).ToLowerInvariant();

                // Check for forbidden executable files
                if (ComponentFileConstraints.ForbiddenExecutableExtensions.Contains(extension))
                {
                    throw new DomainValidationException("ZIP 內不能包含可執行檔");
                }

                // Check for allowed file types
                if (!ComponentFileConstraints.AllowedContentExtensions.Contains(extension))
                {
                    throw new DomainValidationException($"ZIP 內包含不允許的檔案類型: {extension}");
                }

                // Track uncompressed size
                totalUncompressedSize += entry.Length;

                // Check for ZIP bomb
                if (totalUncompressedSize > ComponentFileConstraints.MaxUncompressedSizeBytes)
                {
                    throw new DomainValidationException(
                        "解壓縮後大小超過 200MB 限制（疑似 ZIP 炸彈）");
                }

                // Add to file list
                containedFiles.Add(entry.FullName);
            }

            if (containedFiles.Count == 0)
            {
                throw new DomainValidationException("ZIP 檔案是空的或不包含有效檔案");
            }

            return (containedFiles, totalUncompressedSize);
        }
        catch (InvalidDataException)
        {
            throw new DomainValidationException("ZIP 檔案損壞或無法讀取");
        }
        catch (DomainValidationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new DomainValidationException($"ZIP 驗證失敗: {ex.Message}");
        }
    }
}
