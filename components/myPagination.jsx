import Pagination from "@mui/material/Pagination";
// import Box from "@mui/material/Box";

const MyPagination = ({ items, pageSize, currentPage, onPageChange }) => {
  const pagesCount = Math.ceil(items / pageSize); // 100/10

  if (pagesCount === 1) return null;
  const pages = Array.from({ length: pagesCount }, (_, i) => i + 1);
  //   console.log(pages);

  return (
    <Pagination
      count={pagesCount}
      page={currentPage}
      onChange={(e, value) => onPageChange(value)}
      color="secondary"
    ></Pagination>
  );
};
export default MyPagination;
