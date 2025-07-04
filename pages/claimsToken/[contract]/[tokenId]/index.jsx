/*** Data, collectors and comments of a single token ***/

import { useEffect, useState } from "react";
/* Fetch data */
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  FetchDirectusData,
} from "@/lib/api";
/* Components */
import SingleToken from "@/components/singleToken";
/* Routing */
import { useRouter } from "next/router";

import {
  getRandomCreator,
  getRandomObjectType,
  getRandomPeriod,
  getRandomPlace,
} from "@/lib/dummy";

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";

export default function Id({
  ownersData,
  data,
  data_from_pool,
  organizers,
  artists,
  projects,
}) {
  // console.log("current active claimable token data", data[0].tokenId);

  // TODO: remove dummy data after api ready
  if (data) {
    data = data.map((d) => {
      d.eventPlace = d.metadata.event_location
        ? d.metadata.event_location
        : getRandomPlace();
      d.creator = d.metadata.organizer
        ? d.metadata.organizer
        : getRandomCreator();
      d.objectType = getRandomObjectType();
      d.eventDate = getRandomPeriod();
      d.start_time = d.metadata.start_time;
      d.end_time = d.metadata.end_time;
      if (data_from_pool) {
        d.poolId = data_from_pool[0].key;
        d.duration = data_from_pool[0].value.duration;
      } else {
        d.poolId = null;
        d.duration = null;
      }

      return d;
    });
  }
  /* add projectName to data */
  if (data && projects) {
    data.forEach((item) => {
      const matchingProject = projects.data.find(
        (project) =>
          project.status === "published" &&
          project.location === item.metadata.event_location &&
          project.start_time &&
          new Date(
            new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
          ).toUTCString() === item.metadata.start_time
      );
      if (matchingProject) {
        item.metadata.projectName = matchingProject.name;
        item.metadata.projectId = matchingProject.id;
      }
    });
  }

  /* Client fetch comments */
  const [comments, setComments] = useState(null);
  /* API route: Client fetch Comments by Token ID at KairosDrop NFT Comments API */
  useEffect(() => {
    fetch("/api/get-comments-byTokenID", {
      method: "POST",
      body: data[0].tokenId,
    })
      .then((res) => res.json())
      .then((res) => {
        let data = res.data;
        setComments(data);
      });
  }, []);
  // console.log("comments", comments);

  return (
    <>
      {data.map((d, index) => {
        return (
          <div key={index}>
            <SingleToken
              data={d}
              ownersData={ownersData}
              organizers={organizers}
              artists={artists}
              comments={comments}
            />
          </div>
        );
      })}
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [ownersData, data, data_from_pool, organizers, artists, projects] =
    await Promise.all([
      await MainnetAPI(
        `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
      ),
      await TZKT_API(
        `/v1/tokens?contract=${params.params.contract}&tokenId=${params.params.tokenId}`
      ),
      await GetClaimablePoolID(
        contractAddress,
        params.params.contract,
        params.params.tokenId
      ),
      await FetchDirectusData(`/organizers`),
      await FetchDirectusData(`/artists`),
      await FetchDirectusData(`/projects`),
    ]);

  return {
    props: { ownersData, data, data_from_pool, organizers, artists, projects },
  };
}
