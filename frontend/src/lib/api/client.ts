/**
 * API Error
 * Represents an HTTP error returned by the backend.
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * API request options.
 * The body accepts a JavaScript object,
 * which will be serialized into JSON.
 */
type ApiRequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
};

/**
 * Extract error message from NestJS response.
 */


function getErrorMessage(
    payload: unknown,
    fallback: string,
): string {
    if (
        typeof payload !== 'object' ||
        payload === null
    ) {
        return fallback;
    }

    const data = payload as Record<string, unknown>;

    if ('message' in data) {
        const message = data.message;

        if (typeof message === 'string') {
            return message;
        }

        if (Array.isArray(message)) {
            return message.join(', ');
        }
    }

    if (
        'error' in data &&
        typeof data.error === 'string'
    ) {
        return data.error;
    }

    return fallback;
}


/**
 * Generic API request function.
 */
export async function apiRequest<T>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if(!baseUrl) {
        throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
    }

    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');

    let requestBody: BodyInit | undefined;

    if(options.body !== undefined) {
        headers.set('Content-Type', 'application/json');
        requestBody = JSON.stringify(options.body);
    }

    const url =
     `${baseUrl.replace(/\/+$/, '')}` +
     `${path.startsWith('/') ? path : `/${path}`}`;

     const response = await fetch(url, {
        ...options,
        headers,
        body: requestBody,
        credentials: 'include',
     });

    let responseData: unknown = null;

    if(response.status !== 204) {
        try {
            responseData = await response.json();
        } catch {
            responseData = null;
        }
    }

    if(!response.ok) {
        throw new ApiError(
            getErrorMessage(responseData,
                `Request failed with status ${response.status}.`,
            ),
            response.status,
            responseData,
        );
    }

    return responseData as T;

}

