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
    artist: "Artist",
    venue: "Venue",
    category: "Category",
    readMore: "[ Read More ]",
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
    location: "LOCATION",
    format: "FORMAT",
    description: "Description",
    collectors: "Collectors",
    comments: "Comments",
    collected: "COLLECTED",
    untitled: "UNTITLED",
    displayImage: "display image",
    model3d: "3d model",
    htmlPreview: "HTML Preview",
    pages: "PAGES",
    format: "FORMAT",
    duration: "DURATION",
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
    leaveMessageDesc: "Leave a message for the artist or organizer.",
    placeholder: "Write your message...",
    messageSent: "✓ Message sent successfully",
    yourMessage: "Your message",
  },

  // Wallet page
  wallet: {
    claimed: "Claimed",
    created: "Created",
    location: "Location",
    category: "Category",
    noToken: "No Token",
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
    artists: "Artists",
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
    artist: "Artist",
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
    "研討會／論壇／座談": "Seminar / Forum / Talk",
    "研討會 / 論壇 / 座談": "Seminar / Forum / Talk",
    "節祭／展會／市集": "Festival / Fair / Market",
    "分享會／同好會／見面會": "Meetup / Fan Meeting",
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
