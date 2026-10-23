"use client";

import useSWR from "swr";
import { fetchLogs, fetchStations, fetchSupplies } from "./fetcher";

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
		stations: data ?? [],
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

	return {
		supplies: data ?? [],
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
		logs: data ?? [],
		isLoading,
		isError: error,
		refresh,
	};
}
