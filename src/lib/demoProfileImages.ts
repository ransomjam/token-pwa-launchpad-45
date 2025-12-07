const BASE_PATH = '/demo/demo_profile_images';

const formatIndex = (index: number) => index.toString().padStart(2, '0');

export const getDemoProfileImage = (index: number): string => {
  return `${BASE_PATH}/profile%20pic%20${formatIndex(index)}.jfif`;
};

export const DEMO_PROFILE_IMAGES = Array.from({ length: 18 }, (_, idx) => getDemoProfileImage(idx + 1));
