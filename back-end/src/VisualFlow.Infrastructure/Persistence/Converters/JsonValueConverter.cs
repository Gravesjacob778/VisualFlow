using System.Text.Json;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace VisualFlow.Infrastructure.Persistence.Converters;

/// <summary>
/// JSON value converter for EF Core.
/// </summary>
public sealed class JsonValueConverter<T> : ValueConverter<T, string>
{
    public JsonValueConverter()
        : base(
            v => JsonSerializer.Serialize(v, JsonSerializerOptions.Default),
            v => JsonSerializer.Deserialize<T>(v, JsonSerializerOptions.Default)!)
    {
    }
}