namespace VisualFlow.Domain.Entities;

/// <summary>
/// Represents an uploaded robot component ZIP file containing 3D models and resources.
/// Components are interchangeable robot arm attachments like grippers, sensors, and tools.
/// </summary>
public class ComponentFile : BaseEntity
{
    /// <summary>
    /// Original file name as uploaded by the user.
    /// </summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>
    /// Server-side storage file name (GUID-based for uniqueness).
    /// </summary>
    public string StorageFileName { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// MIME content type (e.g., application/zip).
    /// </summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>
    /// Type of component (gripper, sensor, tool, other).
    /// </summary>
    public string ComponentType { get; set; } = "other";

    /// <summary>
    /// List of files contained within the ZIP archive.
    /// </summary>
    public List<string> ContainedFiles { get; set; } = [];

    /// <summary>
    /// Total uncompressed size of files in bytes (for ZIP bomb detection).
    /// </summary>
    public long UncompressedSize { get; set; }

    /// <summary>
    /// File system path where the file is stored.
    /// </summary>
    public string StoragePath { get; set; } = string.Empty;
}
