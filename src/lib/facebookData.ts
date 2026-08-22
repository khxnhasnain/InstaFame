export interface FacebookPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  topReaction?: "like" | "love" | "care" | "wow";
  commentsList?: { id: string; user: string; avatar: string; text: string; time: string }[];
}

export interface FacebookProfile {
  username: string;
  fullName: string;
  verified: boolean;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  workplace: string;
  education: string;
  livesIn: string;
  fromLocation: string;
  relationshipStatus?: string;
  joinedDate: string;
  friendsCount: number;
  mutualFriendsCount?: number;
  featuredPhotos: string[];
  posts: FacebookPost[];
}

export const FACEBOOK_PRESETS: Record<string, FacebookProfile> = {
  zuck: {
    username: "zuck",
    fullName: "Mark Zuckerberg",
    verified: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    bio: "Founder and CEO at Meta. Building the future of connecting people in AI and the Metaverse. 🚀",
    workplace: "Founder and CEO at Meta",
    education: "Studied Computer Science and Psychology at Harvard University",
    livesIn: "Palo Alto, California",
    fromLocation: "White Plains, New York",
    relationshipStatus: "Married to Priscilla Chan",
    joinedDate: "February 2004",
    friendsCount: 11840000,
    mutualFriendsCount: 42,
    featuredPhotos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
    ],
    posts: [
      {
        id: "fb-p1",
        authorName: "Mark Zuckerberg",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        timestamp: "Yesterday at 4:15 PM · 🌎",
        content: "Excited to share the latest progress on our next-gen Llama 3 open source AI models! Open source AI is crucial for empowering developers, researchers, and creators worldwide. Let's keep building together.",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        likesCount: 142800,
        commentsCount: 18400,
        sharesCount: 5200,
        topReaction: "love",
        commentsList: [
          { id: "fbc1", user: "Andrew Bosworth", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", text: "Big milestone for the team! Proud of everyone involved.", time: "18h" },
          { id: "fbc2", user: "Yann LeCun", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80", text: "Open science wins every time.", time: "16h" }
        ]
      },
      {
        id: "fb-p2",
        authorName: "Mark Zuckerberg",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        timestamp: "3 days ago · 🌎",
        content: "Weekend hydrofoiling out on the water. Great session testing out the new wing foil setup! 🏄‍♂️⚡",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        likesCount: 89400,
        commentsCount: 6200,
        sharesCount: 1800,
        topReaction: "like"
      },
      {
        id: "fb-p3",
        authorName: "Mark Zuckerberg",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        timestamp: "1 week ago · 🌎",
        content: "Meta Connect 2024 dates announced! Looking forward to unveiling the next generation of Ray-Ban Meta smart glasses and mixed reality hardware.",
        imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80",
        likesCount: 215000,
        commentsCount: 24100,
        sharesCount: 12400,
        topReaction: "care"
      }
    ]
  }
};

// Aliases
FACEBOOK_PRESETS["markzuckerberg"] = FACEBOOK_PRESETS["zuck"];

export function getFacebookProfile(username: string): FacebookProfile | null {
  const cleanUsername = username.toLowerCase().trim().replace(/^@/, "");

  if (cleanUsername === "notfound_user" || cleanUsername === "404") {
    return null;
  }

  if (FACEBOOK_PRESETS[cleanUsername]) {
    return FACEBOOK_PRESETS[cleanUsername];
  }

  // Dynamic Generator for custom usernames
  const hash = cleanUsername.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const capitalizedName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);

  const sampleAvatars = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80"
  ];

  const sampleCovers = [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  ];

  const avatar = sampleAvatars[hash % sampleAvatars.length];
  const cover = sampleCovers[hash % sampleCovers.length];
  const friendsCount = (hash * 980) % 4500 + 120;
  const mutualFriendsCount = (hash * 3) % 45 + 2;

  return {
    username: cleanUsername,
    fullName: `${capitalizedName} Smith`,
    verified: hash % 2 === 0,
    avatarUrl: avatar,
    coverUrl: cover,
    bio: `Passionate about technology, travel, and creating memorable experiences with friends. ✨`,
    workplace: `Software Engineer at TechCorp`,
    education: `Studied Computer Science at Stanford University`,
    livesIn: "San Francisco, California",
    fromLocation: "Seattle, Washington",
    relationshipStatus: "In a relationship",
    joinedDate: "March 2012",
    friendsCount,
    mutualFriendsCount,
    featuredPhotos: sampleAvatars,
    posts: [
      {
        id: `fb-dyn-p1`,
        authorName: `${capitalizedName} Smith`,
        authorAvatar: avatar,
        timestamp: "2 hours ago · 🌎",
        content: "Just wrapped up an incredible weekend project! Excited to share what we've been building.",
        imageUrl: sampleCovers[(hash + 1) % sampleCovers.length],
        likesCount: (hash * 12) % 1200 + 45,
        commentsCount: (hash * 3) % 85 + 5,
        sharesCount: (hash * 2) % 30 + 1,
        topReaction: "like",
        commentsList: [
          { id: "c-fb-dyn-1", user: "Sarah Jenkins", avatar: sampleAvatars[1], text: "Awesome work! Looks fantastic.", time: "1h" },
          { id: "c-fb-dyn-2", user: "David Miller", avatar: sampleAvatars[2], text: "Congrats mate! 🙌", time: "30m" }
        ]
      },
      {
        id: `fb-dyn-p2`,
        authorName: `${capitalizedName} Smith`,
        authorAvatar: avatar,
        timestamp: "3 days ago · 🌎",
        content: "Life is all about enjoying the small moments and great coffee. ☕✨",
        imageUrl: sampleAvatars[(hash + 2) % sampleAvatars.length],
        likesCount: (hash * 8) % 800 + 30,
        commentsCount: (hash * 2) % 40 + 2,
        sharesCount: (hash * 1) % 10 + 1,
        topReaction: "love"
      }
    ]
  };
}
