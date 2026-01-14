FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/VisualFlow.WebApi/VisualFlow.WebApi.csproj", "src/VisualFlow.WebApi/"]
COPY ["src/VisualFlow.Application/VisualFlow.Application.csproj", "src/VisualFlow.Application/"]
COPY ["src/VisualFlow.Domain/VisualFlow.Domain.csproj", "src/VisualFlow.Domain/"]
COPY ["src/VisualFlow.Infrastructure/VisualFlow.Infrastructure.csproj", "src/VisualFlow.Infrastructure/"]
RUN dotnet restore "src/VisualFlow.WebApi/VisualFlow.WebApi.csproj"
COPY . .
WORKDIR "/src/src/VisualFlow.WebApi"
RUN dotnet build "VisualFlow.WebApi.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VisualFlow.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VisualFlow.WebApi.dll"]
