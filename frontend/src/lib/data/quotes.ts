import type { Quote } from '$lib/types/quotes';

export const quotes: Quote[] = [
	// Steve Jobs
	{ id: 1, text: "Your time is limited, so don't waste it living someone else's life.", author: 'Steve Jobs', role: 'Co-founder, Apple' },
	{ id: 2, text: "Stay hungry, stay foolish.", author: 'Steve Jobs', role: 'Co-founder, Apple' },
	{ id: 3, text: "The people who are crazy enough to think they can change the world are the ones who do.", author: 'Steve Jobs', role: 'Co-founder, Apple' },

	// Oprah Winfrey
	{ id: 4, text: "Turn your wounds into wisdom.", author: 'Oprah Winfrey', role: 'Media Mogul & Philanthropist' },
	{ id: 5, text: "The biggest adventure you can take is to live the life of your dreams.", author: 'Oprah Winfrey', role: 'Media Mogul & Philanthropist' },
	{ id: 6, text: "You become what you believe.", author: 'Oprah Winfrey', role: 'Media Mogul & Philanthropist' },

	// Elon Musk
	{ id: 7, text: "When something is important enough, you do it even if the odds are not in your favor.", author: 'Elon Musk', role: 'CEO, Tesla & SpaceX' },
	{ id: 8, text: "Persistence is very important. You should not give up unless you are forced to give up.", author: 'Elon Musk', role: 'CEO, Tesla & SpaceX' },

	// Sara Blakely
	{ id: 9, text: "Don't be intimidated by what you don't know. That can be your greatest strength.", author: 'Sara Blakely', role: 'Founder, Spanx' },
	{ id: 10, text: "Failure is not the outcome. Failure is not trying.", author: 'Sara Blakely', role: 'Founder, Spanx' },

	// Richard Branson
	{ id: 11, text: "Screw it, let's do it.", author: 'Richard Branson', role: 'Founder, Virgin Group' },
	{ id: 12, text: "Do not be embarrassed by your failures, learn from them and start again.", author: 'Richard Branson', role: 'Founder, Virgin Group' },

	// Brené Brown
	{ id: 13, text: "Vulnerability is not winning or losing; it's having the courage to show up and be seen.", author: 'Brené Brown', role: 'Author & Researcher' },
	{ id: 14, text: "You are imperfect, you are wired for struggle, but you are worthy of love and belonging.", author: 'Brené Brown', role: 'Author & Researcher' },
	{ id: 15, text: "Courage starts with showing up and letting ourselves be seen.", author: 'Brené Brown', role: 'Author & Researcher' },

	// James Clear
	{ id: 16, text: "Every action you take is a vote for the type of person you wish to become.", author: 'James Clear', role: 'Author, Atomic Habits' },
	{ id: 17, text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: 'James Clear', role: 'Author, Atomic Habits' },
	{ id: 18, text: "Small habits don't add up. They compound.", author: 'James Clear', role: 'Author, Atomic Habits' },

	// Simon Sinek
	{ id: 19, text: "People don't buy what you do; they buy why you do it.", author: 'Simon Sinek', role: 'Author, Start With Why' },
	{ id: 20, text: "A team is not a group of people who work together. A team is a group of people who trust each other.", author: 'Simon Sinek', role: 'Author, Start With Why' },

	// Tony Robbins
	{ id: 21, text: "It's not about the goal. It's about growing to become the person that can accomplish that goal.", author: 'Tony Robbins', role: 'Author & Life Coach' },
	{ id: 22, text: "The only impossible journey is the one you never begin.", author: 'Tony Robbins', role: 'Author & Life Coach' },
	{ id: 23, text: "Where focus goes, energy flows.", author: 'Tony Robbins', role: 'Author & Life Coach' },

	// Robin Sharma
	{ id: 24, text: "Don't live the same year 75 times and call it a life.", author: 'Robin Sharma', role: 'Author, The 5 AM Club' },
	{ id: 25, text: "The secret of getting ahead is getting started.", author: 'Robin Sharma', role: 'Author, The 5 AM Club' },

	// Mark Manson
	{ id: 26, text: "Who you are is defined by what you're willing to struggle for.", author: 'Mark Manson', role: 'Author, The Subtle Art' },
	{ id: 27, text: "Action isn't just the effect of motivation; it's also the cause of it.", author: 'Mark Manson', role: 'Author, The Subtle Art' },

	// Jeff Bezos
	{ id: 28, text: "In the end, we are our choices. Build yourself a great story.", author: 'Jeff Bezos', role: 'Founder, Amazon' },
	{ id: 29, text: "Life's too short to hang out with people who aren't resourceful.", author: 'Jeff Bezos', role: 'Founder, Amazon' },

	// Naval Ravikant
	{ id: 30, text: "Seek wealth, not money or status. Wealth is having assets that earn while you sleep.", author: 'Naval Ravikant', role: 'Entrepreneur & Investor' },
	{ id: 31, text: "The most important skill for getting rich is becoming a perpetual learner.", author: 'Naval Ravikant', role: 'Entrepreneur & Investor' },

	// Gary Vaynerchuk
	{ id: 32, text: "Skills are cheap. Passion is priceless.", author: 'Gary Vaynerchuk', role: 'CEO, VaynerMedia' },
	{ id: 33, text: "Stop whining, start hustling.", author: 'Gary Vaynerchuk', role: 'CEO, VaynerMedia' },

	// Reid Hoffman
	{ id: 34, text: "If you are not embarrassed by the first version of your product, you've launched too late.", author: 'Reid Hoffman', role: 'Co-founder, LinkedIn' },

	// Arianna Huffington
	{ id: 35, text: "We think, mistakenly, that success is the result of the amount of time we put in at work, instead of the quality.", author: 'Arianna Huffington', role: 'Founder, HuffPost & Thrive' },

	// Marie Forleo
	{ id: 36, text: "Everything is figureoutable.", author: 'Marie Forleo', role: 'Author & Entrepreneur' },

	// Seth Godin
	{ id: 37, text: "The cost of being wrong is less than the cost of doing nothing.", author: 'Seth Godin', role: 'Author & Marketing Expert' },
	{ id: 38, text: "Instead of wondering when your next vacation is, set up a life you don't need to escape from.", author: 'Seth Godin', role: 'Author & Marketing Expert' },

	// Walt Disney
	{ id: 39, text: "All our dreams can come true, if we have the courage to pursue them.", author: 'Walt Disney', role: 'Founder, The Walt Disney Company' },

	// Michelle Obama
	{ id: 40, text: "There is no limit to what we, as women, can accomplish.", author: 'Michelle Obama', role: 'Author & Former First Lady' },
	{ id: 41, text: "When they go low, we go high.", author: 'Michelle Obama', role: 'Author & Former First Lady' },

	// Tim Ferriss
	{ id: 42, text: "A person's success in life can usually be measured by the number of uncomfortable conversations he or she is willing to have.", author: 'Tim Ferriss', role: 'Author, The 4-Hour Workweek' },
];
