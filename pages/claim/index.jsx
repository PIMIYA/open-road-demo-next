import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useConnection, } from '@/packages/providers';

const ClaimPage = () => {
  const [poolID, setPoolID] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const { poolID } = router.query;
      console.log('Extracted poolID:', poolID);

      if (!poolID) {
        console.log('Missing poolID');
        router.push('/'); // Redirect to home if no poolID
      } else {
        setPoolID(poolID);
      }
    }
  }, [router, router.isReady, router.query]);

  if (!poolID) {
    return <div>Loading...</div>; // Show loading while extracting poolID
  }

  return (
    <div>
      <div>
        <h2>Claimable NFT</h2>
        <p>Pool ID: {poolID}</p>
      </div>
    </div>
  );
};

export default ClaimPage;