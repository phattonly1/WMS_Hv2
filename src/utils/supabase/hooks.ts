"use client";

import { useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "./client";
import {
	fetchLogs,
	fetchReagentSheets,
	fetchStations,
	fetchSupplies,
} from "./fetcher";

const EMPTY_ARRAY: never[] = [];

const defaultOptions = {
	revalidateOnFocus: false,
	revalidateOnReconnect: false,
	dedupingInterval: 600000,
	errorRetryCount: 2,
};

export function useStations() {
	const {
		data,
		error,
		isLoading,
		mutate: refresh,
	} = useSWR("stations", fetchStations, defaultOptions);

	return {
		stations: data ?? EMPTY_ARRAY,
		isLoading,
		isError: error,
		refresh,
	};
}

export function useSupplies() {
	const {
		data,
		error,
		isLoading,
		mutate: refresh,
	} = useSWR("supplies", fetchSupplies, {
		...defaultOptions,
		dedupingInterval: 60000,
	});

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("realtime-supplies")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "supplies" },
				() => {
					void refresh();
				},
			)
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "supply_logs" },
				() => {
					void refresh();
					void globalMutate(["logs", "REQ"]);
					void globalMutate(["logs", "OUT"]);
					void globalMutate(["logs", "OUT_RETURN"]);
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [refresh]);

	return {
		supplies: data ?? EMPTY_ARRAY,
		isLoading,
		isError: error,
		refresh,
	};
}

export function useLogs(type: "REQ" | "OUT" | "OUT_RETURN") {
	const {
		data,
		error,
		isLoading,
		mutate: refresh,
	} = useSWR(["logs", type], () => fetchLogs(type), {
		...defaultOptions,
		dedupingInterval: 30000,
	});

	return {
		logs: data ?? EMPTY_ARRAY,
		isLoading,
		isError: error,
		refresh,
	};
}

export function useReagentSheets() {
	const {
		data,
		error,
		isLoading,
		mutate: refresh,
	} = useSWR("reagent_order_sheets", fetchReagentSheets, {
		...defaultOptions,
		dedupingInterval: 30000,
	});

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel("realtime-reagent-sheets")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "reagent_order_sheets" },
				() => {
					void refresh();
				},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [refresh]);

	return {
		sheets: data ?? EMPTY_ARRAY,
		isLoading,
		isError: error,
		refresh,
	};
}
