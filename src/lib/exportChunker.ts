export async function fetchAllAdminChunks(searchParams: string, onProgress: (progress: number) => void) {
  let allRows: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`/api/export?${searchParams}&limit=1000&page=${page}&intent=download`);
    const json = await res.json();
    
    if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch chunk');
    }
    
    if (!json.data || json.data.length === 0) break;

    allRows = [...allRows, ...json.data];
    hasMore = json.hasMore && allRows.length < json.totalRows;
    
    // Update progress percentage for UI
    if (json.totalRows > 0) {
      onProgress(Math.min(100, Math.round((allRows.length / json.totalRows) * 100)));
    }

    page++;
  }

  return allRows;
}
