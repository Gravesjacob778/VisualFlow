namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Service for validating and extracting information from ZIP archives.
/// </summary>
public interface IZipValidationService
{
    /// <summary>
    /// Validates a ZIP file and extracts metadata.
    /// </summary>
    /// <param name="stream">Stream containing the ZIP file.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Tuple containing list of files and total uncompressed size.</returns>
    /// <exception cref="Domain.Exceptions.DomainValidationException">Thrown when validation fails.</exception>
    Task<(List<string> Files, long UncompressedSize)> ValidateAndExtractMetadataAsync(
        Stream stream,
        CancellationToken cancellationToken = default);
}
