const en = {
  // Common
  common: {
    loading: "Loading...",
    noData: "No data",
    submit: "Submit",
    skip: "Skip",
    close: "Close",
    reset: "Reset",
    connect: "Connect",
    disconnect: "Disconnect",
    sending: "Sending...",
    anonymous: "Anonymous",
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    upload: "Upload Avatar",
  },

  // Navigation
  nav: {
    home: "Home",
    events: "Events",
    myWallet: "My Wallet",
    mint: "Mint",
  },

  // Footer
  footer: {
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    copyright: "Copyright © 2024 Kairos",
  },

  // Homepage map
  map: {
    recentEvents: "Recent Events",
    allVenues: "All Venues",
    allEvents: "All Events",
    artist: "Creator",
    venue: "Venue",
    category: "Category",
    readMore: "[ Read More ]",
    whatsOnIn: "What's on in",
    // Gesture tutorial
    gestureTitle: "Map Gestures",
    gestureDrag: "Single finger drag:",
    gestureDragDesc: "Pan the map",
    gesturePinch: "Two fingers:",
    gesturePinchDesc: "Pinch to zoom",
    gestureCity: "Change city:",
    gestureCityDesc: "Use on-screen buttons",
    gestureTap: "Tap anywhere to continue",
    // Layer toggle
    popularity: "Popularity",
    creators: "Creators",
    categories: "Categories",
    // Filters
    year: "y",
    month: "m",
    day: "d",
    activityAll: "All",
    activityPast: "Past",
    activityOngoing: "Ongoing",
    activityFuture: "Upcoming",
  },

  // NFT detail
  nft: {
    time: "Date",
    location: "Location",
    format: "Format",
    description: "Description",
    collectors: "Collectors",
    comments: "Comments",
    collected: "COLLECTED",
    untitled: "UNTITLED",
    displayImage: "display image",
    model3d: "3d model",
    htmlPreview: "HTML Preview",
    pages: "Pages",
    duration: "Duration",
    videoNotSupported: "This format is not supported by your browser.",
  },

  // Claim flow
  claim: {
    success: "NFT CLAIMED SUCCESSFULLY",
    alreadyClaimed: "ALREADY CLAIMED",
    completed: "CLAIM COMPLETED",
    soldOut: "SOLD OUT",
    failed: "CLAIM FAILED: INVALID ADDRESS OR POOL",
    error: "AN ERROR OCCURRED",
    viewNft: "VIEW NFT",
    viewMyNft: "VIEW MY NFT",
    viewWallet: "VIEW WALLET",
    emailSent: "CONFIRMATION EMAIL SENT",
    expired: "EXPIRED OR NOT ABLE TO CLAIM",
    walletNotConnected: "Wallet not connected or email not available.",
    invalidAddress: "Invalid address.",
    claimStatusSoldOut: "Claim Status: Sold out",
    claimStatusAlready: "Claim Status: Already claimed",
    claimSuccessful: "Claim successful",
    errorClaiming: "Error claiming NFT: ",
    errorFetching: "ERROR FETCHING NFT DATA",
    clickToClaim: "click to claim NFT",
    connecting: "Connecting...",
    logout: "Logout",
    signInGoogle: "SIGN IN WITH GOOGLE",
    signOut: "SIGN OUT",
    claimNft: "CLAIM NFT",
    scanToClaim: "SCAN TO CLAIM",
  },

  // Comment
  comment: {
    addComment: "Add a comment",
    leaveMessage: "Leave a message",
    leaveMessageDesc: "Leave a message for the creator or organizer.",
    placeholder: "Write your message...",
    messageSent: "✓ Message sent successfully",
    yourMessage: "Your message",
    connectToComment: "Connect your wallet to leave a message",
    connectAndComment: "Connect & Comment",
  },

  // Wallet page
  wallet: {
    claimed: "Claimed",
    created: "Created",
    location: "Location",
    category: "Category",
    noToken: "No Token",
    legendButton: "Categories / Tags",
    legendTags: "Tags",
    legendCategories: "Categories",
    event: "Event",
    creator: "Creator",
    introPlaceholder: "Write something about yourself...",
  },

  // Events page
  events: {
    status: "Event Status",
    upcoming: "Upcoming",
    current: "In Progress",
    archived: "Archived",
    newest: "Newest First",
    oldest: "Oldest First",
    locationTbd: "Location TBD",
    tbd: "TBD",
    eventCover: "Event cover",
    categoryLabel: "Category",
    tagLabel: "Tag",
    creatorOrganizer: "Creator / Organizer",
  },

  // Mint page
  mint: {
    event: "Event",
    title: "Title",
    description: "Description",
    organizer: "Organizer",
    artists: "Creators",
    category: "Category",
    tag: "Tag",
    city: "City",
    venue: "Venue",
    startTime: "Start time",
    endTime: "End time",
    license: "License",
    editions: "Editions",
    royalty: "Royalty (10-25%)",
    applyRoyalty: "Apply royalty sharing",
    walletAddress: "Wallet Address",
    uploadFile: "Upload file",
    uploadDisplay: "Upload display",
    zipIsHtml: "This ZIP is an HTML site (x-directory)",
    selectCityFirst: "Select a city first",
    noVenues: "No venues",
    minting: "Minting...",
    mintButton: "Mint",
  },

  // Organizer component
  role: {
    artist: "Creator",
    organizer: "Organizer",
  },

  // Filter component
  filter: {
    title: "Filter",
    category: "Category",
    tag: "Tag",
    apply: "Apply",
  },

  // Email
  email: {
    subject: "NFT Claim - ",
    leaveMessage: "LEAVE A MESSAGE",
    kairos: "KAIROS",
  },

  // About
  about: {
    sections: [
      {
        title: "The city is a _MAP_ you haven't finished reading",
        description:
          "Exhibitions, markets, workshops — scattered across the city. We put them on the same map.",
      },
      {
        title: "Moments don't repeat. But they can be kept.",
        description:
          "Every attendance earns a digital mark — that moment, that room, those people. Recorded.",
      },
      {
        title: "Shared experience speaks louder than any bio",
        description:
          "No self-description needed. Your trail says it all.",
      },
      {
        title: "Your canvas is made of where you showed up",
        description:
          "Every choice to be present leaves a mark. Over time, they form a portrait of who you are.",
      },
    ],
  },

  // FAQ
  faq: {
    title: "FAQ",
  },

  // Privacy & Terms
  legal: {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },

  // Showcase
  showcase: {
    scanToClaim: "SCAN TO CLAIM",
    copyright: "KAIROS © 2024",
  },

  // Category data mapping (chain data is in Chinese, map to display language)
  categoryMap: {
    "展覽": "Exhibition",
    "表演": "Performance",
    "課程": "Course",
    "導覽": "Guided Tour",
    "工作坊": "Workshop",
    "黑客松": "Hackathon",
    "座談": "Forum / Talk",
    "研討會／論壇／座談": "Seminar / Forum / Talk",
    "研討會 / 論壇 / 座談": "Seminar / Forum / Talk",
    "節祭／展會／市集": "Festival / Fair / Market",
    "分享會／同好會／見面會": "Meetup / Fan Meeting",
  },

  // Data layer placeholder translations (until server supports i18n)
  venueMap: {
    // Taiwan — Taipei
    "臺北市立美術館": "Taipei Fine Arts Museum",
    "臺北當代藝術館": "Museum of Contemporary Art Taipei",
    "台北當代藝術館": "Museum of Contemporary Art Taipei",
    "松山文創園區": "Songshan Cultural & Creative Park",
    "國家兩廳院": "National Theater & Concert Hall",
    "PLAYground 空總劇場": "PLAYground C-LAB Theater",
    "C-Lab (空總 台灣聲響實驗室)": "C-LAB Taiwan Sound Lab",
    "濕地 Venue": "Wetland Venue",
    "打開－當代藝術工作站 (OCAC)": "Open Contemporary Art Center (OCAC)",
    "台北流行音樂中心": "Taipei Music Center",
    "華山1914文化創意產業園區": "Huashan 1914 Creative Park",
    "國立臺灣美術館": "National Taiwan Museum of Fine Arts",
    "C-LAB 臺灣當代文化實驗場": "C-LAB Taiwan Contemporary Culture Lab",
    "寶藏巖國際藝術村": "Treasure Hill Artist Village",
    "剝皮寮歷史街區": "Bopiliao Historic Block",
    "北師美術館": "MoNTUE",
    "忠泰美術館": "JUT Art Museum",
    "大稻埕": "Dadaocheng",
    // Taiwan — New Taipei
    "新北美術館": "New Taipei City Art Museum",
    // Japan — Tokyo
    "森美術館": "Mori Art Museum",
    "teamLab Planets": "teamLab Planets",
    "東京都現代美術館 (Museum of Contemporary Art Tokyo)": "Museum of Contemporary Art Tokyo",
    "NEORT": "NEORT",
    "CCBT (Civic Creative Base Tokyo)": "Civic Creative Base Tokyo (CCBT)",
  },
  eventMap: {
    "街角的利息": "The Interest from the Street Corner",
    "北美館開放網絡計畫 － 共域計畫之二： GM，開路：藝文生態系的在場證明": "TFAM Open Network – GM, KAIROS: Proof of Attendance in Art Ecosystem",
    "失聲祭": "Lacking Sound Festival",
  },
  nftNameMap: {},
  artistMap: {
    "林晏竹": "Lin Yen-Chu",
    "莊哲瑋 INFRAPUNK": "INFRAPUNK",
    "煮雪的人 Zhuxue Deren": "Zhuxue Deren",
    "沐子 Graphyni": "Graphyni",
    "張明曜 Chang Ming-Yao": "Chang Ming-Yao",
    "hemilylan": "hemilylan",
    "呂蔚": "Lu Wei",
    "失聲祭": "Lacking Sound Fest.",
    "開路": "KAIROS",
  },
  organizerMap: {
    "開路 KAIROS": "KAIROS",
    "台北當代藝術館": "MoCA Taipei",
    "北美館開放網絡計畫共域之二": "TFAM Open Network Project",
    "失聲祭Lacking Sound Fest.": "Lacking Sound Festival",
  },

  // Tag data mapping (chain data is in Chinese — includes compound tags)
  tagMap: {
    // Simple tags
    "視覺藝術": "Visual Arts",
    "新媒體": "New Media",
    "說唱": "Rap",
    "戲劇": "Theater",
    "舞蹈": "Dance",
    "音樂": "Music",
    "設計": "Design",
    "建築": "Architecture",
    "元宇宙": "Metaverse",
    "出版": "Publishing",
    "電影": "Film",
    "人文": "Humanities",
    "科學": "Science",
    // Compound tags (from chain data)
    "視覺:繪畫": "Visual: Painting",
    "視覺:雕塑": "Visual: Sculpture",
    "視覺:攝影": "Visual: Photography",
    "視覺:裝置": "Visual: Installation",
    "視覺:影像": "Visual: Video",
    "視覺:工藝": "Visual: Craft",
    "表演:音樂（搖滾、古典、電子、音像）": "Performance: Music",
    "表演:舞蹈（現代舞、舞踏、民俗）": "Performance: Dance",
    "設計:時尚": "Design: Fashion",
    "科技:區塊鏈": "Tech: Blockchain",
    "科學:自然科學（天文、地理）": "Science: Natural Science",
    "書籍:詩歌": "Books: Poetry",
  },

  // Mint const categories
  mintCategories: [
    { label: "Exhibition" },
    { label: "Performance" },
    { label: "Course" },
    { label: "Guided Tour" },
    { label: "Workshop" },
    { label: "Hackathon" },
    { label: "Seminar / Forum / Talk" },
    { label: "Festival / Fair / Market" },
    { label: "Meetup / Fan Meeting" },
  ],
  mintTags: [
    { label: "Visual Arts" },
    { label: "New Media" },
    { label: "Rap" },
    { label: "Theater" },
    { label: "Dance" },
    { label: "Music" },
    { label: "Design" },
    { label: "Architecture" },
    { label: "Metaverse" },
    { label: "Publishing" },
    { label: "Film" },
    { label: "Humanities" },
    { label: "Science" },
  ],
};

export default en;
