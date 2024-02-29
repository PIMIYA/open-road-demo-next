import styles from "@/styles/Pagination.module.css";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import PaginationItem from "@mui/material/PaginationItem";
// import Box from "@mui/material/Box";

const MyPagination = ({ items, pageSize, currentPage, onPageChange }) => {
  const pagesCount = Math.ceil(items / pageSize); // 100/10

  if (pagesCount === 1) return null;
  const pages = Array.from({ length: pagesCount }, (_, i) => i + 1);
  //   console.log(pages);

  return (
    <div className={styles.pagination}>
      {pages.map((page) => (
        <a
          key={page}
          className={styles.pageLink}
          onClick={() => onPageChange(page)}
        >
          <div
            className={
              page === currentPage ? styles.pageItemActive : styles.pageItem
            }
          >
            <div>{page}</div>
          </div>
        </a>
      ))}
    </div>
  );
};
export default MyPagination;
