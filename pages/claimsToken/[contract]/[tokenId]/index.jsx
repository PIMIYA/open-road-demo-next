/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { MainnetAPI } from "@/lib/api";
/* Components */
import SingleToken from "@/components/singleToken";
/* Routing */
import { useRouter } from "next/router";

import { getRandomCreator, getRandomObjectType, getRandomPeriod, getRandomPlace } from "@/lib/dummy";

export default function Id({ data }) {
  //   console.log(data);
  // const router = useRouter();
  // const query = router.query;
  // console.log(query);

  // TODO: replace dummy data with real data
  if (data && !data.objectType) {
    data.creator = getRandomCreator();
    data.objectType = getRandomObjectType();
    data.eventDate = getRandomPeriod();
    data.eventPlace = getRandomPlace();
  }

  return <SingleToken data={data} />;
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [data] = await Promise.all([
    await MainnetAPI(
      `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
    ),
  ]);

  return {
    props: { data },
  };
}
