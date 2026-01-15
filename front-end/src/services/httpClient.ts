export const buildUrl = (baseURL: string, endpoint: string): string => {
    if (endpoint.startsWith("http")) {
        return endpoint;
    }

    return `${baseURL}${endpoint}`;
};

export const parseJson = async (response: Response): Promise<unknown | null> => {
    try {
        return await response.json();
    } catch {
        return null;
    }
};
