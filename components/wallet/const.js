export const categoryNames = {
  'Exhibition': '展覽',
  'Performance': '表演',
  'Course': '課程',
  'Guided Tour': '導覽',
  'Workshop': '工作坊',
  'Hackathon': '黑客松',
  'Seminar': '座談',
  'Family': '親子',
  'Festival': '節祭／展會／市集',
  'Meetup': '分享會／同好會／見面會',
};

export const tagNames = {
  'Visual': '視覺',
  'Performance': '表演',
  'Design': '設計',
  'Movie': '電影',
  'Tech': '科技',
  'Book': '書籍',
  'Culture': '文化',
  'Science': '科學',
};

export const shapeMap = {
  1: {
    label: 'Exhibition',
    type: 'round',
    sides: 0,
  },
  2: {
    label: 'Performance',
    type: 'polygon',
    sides: 3,
  },
  3: {
    label: 'Course',
    type: 'polygon',
    sides: 4,
  },
  4: {
    label: 'Guided Tour',
    type: 'polygon',
    sides: 5,
  },
  5: {
    label: 'Workshop',
    type: 'polygon',
    sides: 6,
  },
  6: {
    label: 'Hackathon',
    type: 'round',
    sides: 0,
    strip: true,
  },
  7: {
    label: 'Seminar',
    type: 'polygon',
    sides: 3,
    strip: true,
  },
  8: {
    label: 'Family',
    type: 'polygon',
    sides: 4,
    strip: true,
  },
  9: {
    label: 'Festival',
    type: 'polygon',
    sides: 5,
    strip: true,
  },
  10: {
    label: 'Meetup',
    type: 'polygon',
    sides: 6,
    strip: true,
  },
};

export const hueMap = {
  'Visual': 233,
  'Performance': 321,
  'Design': 158,
  'Movie': 38,
  'Tech': 0,
  'Book': 132,
  'Culture': 225,
  'Science': 69,
};

export const tagsLabelColor = {
  'Visual': '#0016B9',
  'Performance': '#da46a7',
  'Design': '#20956b',
  'Movie': '#f6a800',
  'Tech': '#aa0000',
  'Book': '#8e24aa',
  'Culture': '#f4511e',
  'Science': '#9eaf43',
};

export const moveModes = [
  'Freedraw',
  'Clockwise',
  'Smooth',
];
