import React, { useEffect, useRef, useState } from "react";
import { paginate } from "@/lib/paginate";

import Box from "@mui/material/Box";
import MyPagination from "@/components/myPagination";

export default function LazyLoadPaginatedCards({ apiEndPoint, children, pageSize }) {
  const [data, setData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const listTopRef = useRef(null);

  const onPageChange = (page) => {
    setCurrentPage(page);

    if(listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(apiEndPoint);
      try {
        const data = await response.json();
        return setData(data);
      } catch (error) {
        return null;
      }
    };

    fetchData();
  }, []);


  let paginatedPosts;

  if (data) {
    paginatedPosts = paginate(data.tokens, currentPage, pageSize);
  }

  if (children.length) {
    throw new Error("LazyLoadPaginatedCards 只能包含一個子元件");
  }

  let enhancedChild;
  if (React.isValidElement(children)) {
    enhancedChild = React.cloneElement(children, {
      data: paginatedPosts,
      pageSize,
    });
  } else {
    throw new Error("LazyLoadPaginatedCards 的子元件必須是 React Element");
  }

  return (
    <>
      <Box
        ref={listTopRef}
        sx={{
          position: 'absolute',
          top: '-20px',
        }}
      />
      {enhancedChild}
      <Box my={10}>
        <MyPagination
          items={data?.tokens.length || 0} // 24
          currentPage={currentPage} // 1
          pageSize={pageSize} // 6
          onPageChange={onPageChange}
        />
      </Box>
    </>
  )
}
