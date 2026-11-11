export function paginateIssues<T>(issues: T[], page: number, pageSize = 50) {
    const pageCount = Math.ceil(issues.length / pageSize);

    return {
        pageCount,
        entries: issues.slice(page * pageSize, (page + 1) * pageSize),
    };
}

export function getPageLinks(pageCount: number, currentPage: number, radius = 3): Array<number | "ellipsis"> {
    if (pageCount < 1) return [];

    const current = currentPage + 1;
    const pages = new Set([1, pageCount]);

    for (let page = Math.max(1, current - radius); page <= Math.min(pageCount, current + radius); page++) {
        pages.add(page);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const links: Array<number | "ellipsis"> = [];

    for (let index = 0; index < sorted.length; index++) {
        const page = sorted[index];
        const previous = sorted[index - 1];

        if (previous !== undefined && page - previous === 2) links.push(previous + 1);
        if (previous !== undefined && page - previous > 2) links.push("ellipsis");
        links.push(page);
    }

    return links;
}
