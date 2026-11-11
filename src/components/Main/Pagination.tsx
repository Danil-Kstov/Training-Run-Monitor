import { getPageLinks } from "../../lib/paginateIssues";

type PaginationProps = {
    currentPage: number;
    pageCount: number;
    label: string;
    onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, pageCount, label, onPageChange }: PaginationProps) => (
    <nav
        className="main__pagination"
        aria-label={`${label} pages`}
    >
        <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
        >
            Previous
        </button>

        {getPageLinks(pageCount, currentPage).map((page, index) => (
            page === "ellipsis" ? (
                <span
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                >
                    …
                </span>
            ) : (
                <button
                    key={page}
                    type="button"
                    aria-label={`Go to ${label} page ${page}`}
                    aria-current={page === currentPage + 1 ? "page" : undefined}
                    onClick={() => onPageChange(page - 1)}
                >
                    {page}
                </button>
            )
        ))}

        <button
            type="button"
            disabled={currentPage + 1 >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
        >
            Next
        </button>
    </nav>
);

export default Pagination;
