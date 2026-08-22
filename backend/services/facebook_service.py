from typing import Optional, Dict, Any, List

FACEBOOK_PRESETS: Dict[str, Dict[str, Any]] = {
    "zuck": {
        "username": "zuck",
        "fullName": "Mark Zuckerberg",
        "verified": True,
        "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "coverUrl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        "bio": "Founder and CEO at Meta. Building the future of connecting people in AI and the Metaverse (Python Service). 🚀",
        "workplace": "Founder and CEO at Meta",
        "education": "Studied Computer Science and Psychology at Harvard University",
        "livesIn": "Palo Alto, California",
        "fromLocation": "White Plains, New York",
        "relationshipStatus": "Married to Priscilla Chan",
        "joinedDate": "February 2004",
        "friendsCount": 11840000,
        "mutualFriendsCount": 42,
        "featuredPhotos": [
            "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
        ],
        "posts": [
            {
                "id": "py-fb-p1",
                "authorName": "Mark Zuckerberg",
                "authorAvatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                "timestamp": "Yesterday at 4:15 PM · 🌎",
                "content": "Excited to share our latest Python backend integration for InstaFame! Open source AI and robust FastAPI services power our global connectivity.",
                "imageUrl": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
                "likesCount": 142800,
                "commentsCount": 18400,
                "sharesCount": 5200,
                "topReaction": "love",
                "commentsList": [
                    {"id": "py-fbc1", "user": "Guido van Rossum", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", "text": "Python makes everything cleaner and faster!", "time": "18h"}
                ]
            }
        ]
    }
}

FACEBOOK_PRESETS["markzuckerberg"] = FACEBOOK_PRESETS["zuck"]

def get_facebook_profile(username: str) -> Optional[Dict[str, Any]]:
    clean_user = username.lower().strip().lstrip("@")

    if clean_user in ["notfound_user", "404"]:
        return None

    if clean_user in FACEBOOK_PRESETS:
        return FACEBOOK_PRESETS[clean_user]

    char_sum = sum(ord(c) for c in clean_user)
    cap_name = clean_user.capitalize()

    sample_avatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80"
    ]

    sample_covers = [
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ]

    avatar = sample_avatars[char_sum % len(sample_avatars)]
    cover = sample_covers[char_sum % len(sample_covers)]
    friends_count = (char_sum * 980) % 4500 + 120

    return {
        "username": clean_user,
        "fullName": f"{cap_name} Smith",
        "verified": char_sum % 2 == 0,
        "avatarUrl": avatar,
        "coverUrl": cover,
        "bio": "Passionate about Python backend development & technology. 🐍✨",
        "workplace": "Backend Engineer at TechCorp",
        "education": "Studied Computer Science at Stanford University",
        "livesIn": "San Francisco, California",
        "fromLocation": "Seattle, Washington",
        "relationshipStatus": "In a relationship",
        "joinedDate": "March 2012",
        "friendsCount": friends_count,
        "mutualFriendsCount": 12,
        "featuredPhotos": sample_avatars,
        "posts": [
            {
                "id": "py-fb-dyn-p1",
                "authorName": f"{cap_name} Smith",
                "authorAvatar": avatar,
                "timestamp": "2 hours ago · 🌎",
                "content": "Just launched our Python FastAPI backend service! High performance and clean routing.",
                "imageUrl": cover,
                "likesCount": (char_sum * 12) % 1200 + 45,
                "commentsCount": (char_sum * 3) % 85 + 5,
                "sharesCount": (char_sum * 2) % 30 + 1,
                "topReaction": "like",
                "commentsList": [
                    {"id": "py-c-fb-1", "user": "Sarah Jenkins", "avatar": sample_avatars[1], "text": "Awesome Python backend!", "time": "1h"}
                ]
            }
        ]
    }
