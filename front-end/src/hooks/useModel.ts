/**
 * useModel Hook
 * 簡化在 React 元件中載入 3D 模型的流程
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { loadModel, revokeBlobURL, type LoadedModel, type LoadProgress } from '@/lib/modelLoader';
import modelService from '@/services/ModelService';
import type { ModelListItem, ModelsQueryParams } from '@/types/model';

/**
 * 模型載入狀態
 */
export interface UseModelState {
    loading: boolean;
    error: Error | null;
    model: LoadedModel | null;
    progress: LoadProgress | null;
}

/**
 * 模型清單狀態
 */
export interface UseModelsListState {
    loading: boolean;
    error: Error | null;
    models: ModelListItem[];
    hasMore: boolean;
    page: number;
    totalPages: number;
}

/**
 * useModel - 載入單一 3D 模型
 */
export function useModel(modelId: string | null) {
    const [state, setState] = useState<UseModelState>({
        loading: false,
        error: null,
        model: null,
        progress: null,
    });

    const modelUrlRef = useRef<string | null>(null);

    // 載入模型
    const load = useCallback(async (id: string) => {
        setState({ loading: true, error: null, model: null, progress: null });

        try {
            const loadedModel = await loadModel(id, (progress) => {
                console.info('模型載入進度:', progress.message);
                setState((prev) => ({ ...prev, progress }));
            });

            modelUrlRef.current = loadedModel.url;

            setState({
                loading: false,
                error: null,
                model: loadedModel,
                progress: { phase: 'complete', message: '模型載入完成', progress: 100 },
            });
        } catch (error) {
            setState({
                loading: false,
                error: error as Error,
                model: null,
                progress: null,
            });
        }
    }, []);

    // 重新載入
    const reload = useCallback(() => {
        if (modelId) {
            load(modelId);
        }
    }, [modelId, load]);

    // 自動載入
    useEffect(() => {
        if (modelId) {
            load(modelId);
        }

        // 清理：釋放 Blob URL
        return () => {
            if (modelUrlRef.current) {
                revokeBlobURL(modelUrlRef.current);
                modelUrlRef.current = null;
            }
        };
    }, [modelId, load]);

    return {
        ...state,
        reload,
    };
}

/**
 * useModelsList - 取得模型清單（支援分頁）
 */
export function useModelsList(params?: ModelsQueryParams) {
    const [state, setState] = useState<UseModelsListState>({
        loading: true,
        error: null,
        models: [],
        hasMore: false,
        page: params?.page || 1,
        totalPages: 1,
    });

    // 載入清單
    const load = useCallback(async (queryParams?: ModelsQueryParams) => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const response = await modelService.getModelsList(queryParams);

            if (!response.success || !response.data) {
                throw new Error('無法取得模型清單');
            }

            const { models, pagination } = response.data;

            setState({
                loading: false,
                error: null,
                models,
                hasMore: pagination.page < pagination.totalPages,
                page: pagination.page,
                totalPages: pagination.totalPages,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
        }
    }, []);

    // 載入下一頁
    const loadMore = useCallback(() => {
        if (state.hasMore && !state.loading) {
            load({ ...params, page: state.page + 1 });
        }
    }, [params, state.hasMore, state.loading, state.page, load]);

    // 重新載入
    const reload = useCallback(() => {
        load(params);
    }, [params, load]);

    // 初始載入
    useEffect(() => {
        load(params);
    }, [params?.category, params?.search, params?.page, params?.limit, load]);

    return {
        ...state,
        loadMore,
        reload,
    };
}

/**
 * useModelsByCategory - 取得特定類別的模型
 */
export function useModelsByCategory(category: string, params?: Omit<ModelsQueryParams, 'category'>) {
    const [state, setState] = useState<UseModelsListState>({
        loading: true,
        error: null,
        models: [],
        hasMore: false,
        page: params?.page || 1,
        totalPages: 1,
    });

    const load = useCallback(async () => {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        try {
            const response = await modelService.getModelsByCategory(category, params);

            if (!response.success || !response.data) {
                throw new Error(`無法取得類別 ${category} 的模型`);
            }

            const { models, pagination } = response.data;

            setState({
                loading: false,
                error: null,
                models,
                hasMore: pagination.page < pagination.totalPages,
                page: pagination.page,
                totalPages: pagination.totalPages,
            });
        } catch (error) {
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error as Error,
            }));
        }
    }, [category, params]);

    useEffect(() => {
        load();
    }, [load]);

    return {
        ...state,
        reload: load,
    };
}

/**
 * useModelPreload - 預載入模型（不立即使用）
 */
export function useModelPreload(modelIds: string[]) {
    const [preloadedIds, setPreloadedIds] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Map<string, Error>>(new Map());

    useEffect(() => {
        modelIds.forEach(async (modelId) => {
            if (!preloadedIds.has(modelId)) {
                try {
                    const loaded = await loadModel(modelId);
                    // 立即釋放，只是預載到 IndexedDB
                    revokeBlobURL(loaded.url);

                    setPreloadedIds((prev) => new Set(prev).add(modelId));
                } catch (error) {
                    setErrors((prev) => new Map(prev).set(modelId, error as Error));
                }
            }
        });
    }, [modelIds, preloadedIds]);

    return {
        preloadedIds,
        errors,
    };
}
