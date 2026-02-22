import { NextResponse } from 'next/server';
import type { ServeFinderData } from '@/types/serveFinder';

// Placeholder images (random 16:9 from picsum)
const eventImages = [
  'https://picsum.photos/seed/event1/800/450',
  'https://picsum.photos/seed/event2/800/450',
  'https://picsum.photos/seed/event3/800/450',
  'https://picsum.photos/seed/event4/800/450',
];

const oppImages = [
  'https://picsum.photos/seed/opp1/800/450',
  'https://picsum.photos/seed/opp2/800/450',
  'https://picsum.photos/seed/opp3/800/450',
  'https://picsum.photos/seed/opp4/800/450',
  'https://picsum.photos/seed/opp5/800/450',
  'https://picsum.photos/seed/opp6/800/450',
  'https://picsum.photos/seed/opp7/800/450',
  'https://picsum.photos/seed/opp8/800/450',
];

const MOCK_DATA: ServeFinderData = {
  Opportunities: [
    {
      ID: 1,
      Title: "Weekend One Work Crew",
      Description: "If you want an opportunity to serve our High School students as they spend their weekend at winter retreat, then we have the perfect spot for you on our Work Crew! Help with setup, tear down, and behind-the-scenes logistics.",
      Event_ID: 501,
      Event_Title: "HS Winter Retreat 2026",
      Event_Image_URL: eventImages[0],
      Congregation_Name: "Church Wide",
      Ministry_Name: "Students",
      Day_Of_Week: "Friday",
      Time: "Fri, Feb 20, 2026 9:00 PM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[0],
      Volunteers_Needed: 50,
    },
    {
      ID: 2,
      Title: "Weekend Two Work Crew",
      Description: "Serve our high school students during the second weekend of winter retreat. Same great experience, different weekend! Help with setup, tear down, and behind-the-scenes logistics.",
      Event_ID: 501,
      Event_Title: "HS Winter Retreat 2026",
      Event_Image_URL: eventImages[0],
      Congregation_Name: "Church Wide",
      Ministry_Name: "Students",
      Day_Of_Week: "Friday",
      Time: "Fri, Feb 27, 2026 9:00 PM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[1],
      Volunteers_Needed: 100,
    },
    {
      ID: 3,
      Title: "Easter Egg Drop Volunteer",
      Description: "Do you love seeing the WONDER in young kid's faces as they learn about Jesus? The JOY of serving alongside friends and family? Join us for the Easter Egg Drop and help make it an unforgettable experience!",
      Event_ID: 502,
      Event_Title: "Easter Egg Drop 2026",
      Event_Image_URL: eventImages[1],
      Congregation_Name: "Algonac",
      Ministry_Name: "Kids",
      Day_Of_Week: "Saturday",
      Time: "Sat, Mar 28, 2026 8:30 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[2],
      Volunteers_Needed: 30,
    },
    {
      ID: 4,
      Title: "Decorating and Set Up",
      Description: "You will be helping with various decorations throughout the building. Thursday, April 23 — Day or Evening shifts available. Friday, April 24 — Day shifts available.",
      Event_ID: 503,
      Event_Title: "Shine On Prom 2026",
      Event_Image_URL: eventImages[2],
      Congregation_Name: "Troy",
      Ministry_Name: "Special Needs",
      Day_Of_Week: "Saturday",
      Time: "Sat, Apr 25, 2026 9:30 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[3],
      Volunteers_Needed: 25,
    },
    {
      ID: 5,
      Title: "Buddies",
      Description: "Would you like to be a buddy for one of our special prom guests? You will be assigned one on one (by gender) with a guest, sharing in their excitement and making sure they have the best night ever!",
      Event_ID: 503,
      Event_Title: "Shine On Prom 2026",
      Event_Image_URL: eventImages[2],
      Congregation_Name: "Troy",
      Ministry_Name: "Special Needs",
      Day_Of_Week: "Saturday",
      Time: "Sat, Apr 25, 2026 11:00 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[4],
      Volunteers_Needed: 40,
    },
    {
      ID: 6,
      Title: "Check In",
      Description: "Join our check in team to help greet guests as they arrive for this very special prom. Thank you for considering to serve!",
      Event_ID: 503,
      Event_Title: "Shine On Prom 2026",
      Event_Image_URL: eventImages[2],
      Congregation_Name: "Troy",
      Ministry_Name: "Special Needs",
      Day_Of_Week: "Saturday",
      Time: "Sat, Apr 25, 2026 11:00 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[5],
      Volunteers_Needed: 15,
    },
    {
      ID: 7,
      Title: "Sunday Morning Worship Team — Vocals",
      Description: "Use your gift of singing to lead others in worship on Sunday mornings. Audition required. Rehearsals are Wednesday evenings.",
      Event_ID: null,
      Event_Title: null,
      Event_Image_URL: null,
      Congregation_Name: "Troy",
      Ministry_Name: "Worship",
      Day_Of_Week: "Sunday",
      Time: "Sundays, 8:00 AM & 10:00 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[6],
      Volunteers_Needed: null,
    },
    {
      ID: 8,
      Title: "Kids Ministry Volunteer — Preschool",
      Description: "Help our youngest ones learn about God's love through play, stories, and songs. Background check required. Serve once or twice a month on Sundays.",
      Event_ID: null,
      Event_Title: null,
      Event_Image_URL: null,
      Congregation_Name: "Warren",
      Ministry_Name: "Kids",
      Day_Of_Week: "Sunday",
      Time: "Sundays, 10:00 AM",
      Sign_Up_URL: "#",
      Image_URL: oppImages[7],
      Volunteers_Needed: 20,
    },
  ],
  Settings: {
    No_Opportunities_Found_Label: "No serving opportunities found.",
    Sign_Up_Button_Label: "Sign Up",
    Details_Button_Label: "See Details",
    Sign_Up_Base_URL: "#",
    Details_Base_URL: "#",
  },
};

export async function GET() {
  try {
    return NextResponse.json(MOCK_DATA, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('ServeFinder API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: String(error) },
      { status: 500 }
    );
  }
}
