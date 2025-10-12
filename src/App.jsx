import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// --- CHART.JS IMPORTS AND REGISTRATION ---
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
// ----------------------------------------

// --- GLOBAL VARIABLES (Provided by the execution environment) ---
// Note: Uncomment these lines to use the variables provided by the Canvas environment.
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/*
// Mocking global variables for local development clarity
const firebaseConfig = {
  apiKey: "MOCK_API_KEY",
  authDomain: "MOCK_AUTH_DOMAIN",
  projectId: "MOCK_PROJECT_ID",
  storageBucket: "MOCK_STORAGE_BUCKET",
  messagingSenderId: "MOCK_MESSAGING_SENDER_ID",
  appId: "MOCK_APP_ID"
};
const initialAuthToken = null; // Mock token
const appId = "screentime-dashboard";
*/

// --- FIREBASE INITIALIZATION AND CONTEXT (Simplified for Single File) ---
let db;
let auth;

/**
 * Login Component: Handles user input and simulates a login process.
 */
const LoginComponent = ({ navigateTo, setAuthUser }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('error');
    const [isLoading, setIsLoading] = useState(false);

    // Simple delay function for user feedback
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage(null);
        
        if (password.length < 6) {
            setMessage('Password must be at least 6 characters long.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        await sleep(1000); // Simulate network delay

        try {
            const userId = auth.currentUser?.uid || 'anonymous-user';
            const userProfileRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'data');
            
            // Save user profile data to Firestore
            await setDoc(userProfileRef, {
                name: name,
                email: email,
                lastLogin: serverTimestamp(),
                onboarded: true 
            }, { merge: true });

            setAuthUser({ uid: userId, email: email, name: name });

            setMessage(`Welcome, ${name}! Redirecting to dashboard...`);
            setMessageType('success');

            await sleep(1000);
            navigateTo('dashboard'); 

        } catch (error) {
            console.error("Login simulation error:", error);
            setMessage(`Login failed. Check console for details.`);
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-xl p-8 md:p-10 shadow-xl">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-4">Account Login</h2>
            <p className="text-center text-gray-500 mb-8">Enter your details to proceed.</p>

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input type="text" id="username" value={name} onChange={(e) => setName(e.target.value)}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                           placeholder="John Doe" required />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email ID</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                           placeholder="you@example.com" required />
                </div>

                <div>
                    <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password-login" value={password} onChange={(e) => setPassword(e.target.value)}
                           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                           placeholder="••••••••" required />
                </div>

                <button type="submit" disabled={isLoading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-medium text-white 
                                    ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150`}>
                    {isLoading ? 'Processing...' : 'Log In'}
                </button>
            </form>
            
            {(message && !isLoading) && (
                <div className={`mt-4 p-3 border rounded-lg text-center 
                                ${messageType === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {message}
                </div>
            )}
        </div>
    );
};

/**
 * Home Component: The landing page with a welcome and a call to action.
 */
const HomeComponent = ({ navigateTo, isAuthReady }) => {
    return (
        <div className="text-center text-white p-8 bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
            <h1 className="text-5xl font-extrabold mb-4 text-blue-400">Screen Time Dashboard</h1>
            <p className="text-xl text-gray-300 mb-8">
                Visualize and manage your digital life with clarity and purpose.
            </p>

            <button onClick={() => navigateTo('login')} disabled={!isAuthReady}
               className={`inline-block py-3 px-8 text-xl font-bold rounded-lg shadow-lg transform transition duration-300 ease-in-out 
                           ${isAuthReady ? 'bg-blue-600 hover:bg-blue-500 hover:scale-105' : 'bg-gray-500 cursor-not-allowed'}`}>
                {isAuthReady ? 'Get Started / Login' : 'Loading App...'}
            </button>
            
            <p className="text-sm text-gray-500 mt-8">A Hacktoberfest Contribution</p>
        </div>
    );
};

/**
 * Dashboard Chart Component: Renders the weekly screen time bar chart.
 */
const DashboardChart = () => {
    const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Screen Time (hours)',
            data: [7.5, 6.2, 8.1, 5.9, 9.3, 11.0, 10.5],
            backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue color inspired by Tailwind
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            borderRadius: 6, // Rounded corners for bars
        }],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { 
                position: 'top',
                labels: {
                    font: { size: 14 }
                }
            },
            title: { 
                display: true, 
                text: 'Weekly Screen Time (Hours)',
                font: { size: 18, weight: 'bold' }
            },
        },
        scales: {
            y: { 
                beginAtZero: true,
                title: { 
                    display: true, 
                    text: 'Hours Used',
                    font: { size: 14 }
                } 
            },
        },
        maintainAspectRatio: false, // Ensures the chart fills its container
    };

    return (
        <div className="w-full h-96 p-4 border border-gray-100 rounded-lg shadow-inner bg-white">
            <Bar data={data} options={options} />
        </div>
    );
};


/**
 * Dashboard Component (Integrates the chart and user info)
 */
const DashboardComponent = ({ authUser }) => {
    return (
        <div className="w-full max-w-4xl bg-white rounded-xl p-8 md:p-10 shadow-xl text-center">
            <h2 className="text-4xl font-bold text-blue-600 mb-2">Screen Time Overview</h2>
            <p className="text-xl text-gray-700 mb-6">
                Welcome back, **{authUser.name || 'User'}**! Here is your weekly activity.
            </p>
            
            {/* Render the chart */}
            <DashboardChart /> 

            {/* User ID and metadata */}
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-semibold text-gray-800 mb-2">Your User ID (for collaboration):</p>
                <code className="block text-sm p-2 bg-gray-200 rounded mt-2 overflow-x-auto text-gray-600">
                    {authUser.uid}
                </code>
            </div>
        </div>
    );
};


/**
 * Main Application Component
 */
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authUser, setAuthUser] = useState(null);

    const navigateTo = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // 1. Initialize Firebase and Authentication
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);
            
            const handleAuth = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                        console.log("Signed in with custom token.");
                    } else {
                        await signInAnonymously(auth);
                        console.log("Signed in anonymously.");
                    }
                } catch (e) {
                    console.error("Firebase Auth Error:", e);
                }
            };
            
            // 2. Set up Auth State Listener
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // Fetch user profile data if authenticated
                    const userProfileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'data');
                    const profileSnap = await getDoc(userProfileRef);
                    
                    let userProfile = {};
                    if (profileSnap.exists() && profileSnap.data().onboarded) {
                         userProfile = profileSnap.data();
                         // User is logged in and has completed the simulated onboarding (login form)
                         setAuthUser({ uid: user.uid, ...userProfile });
                         // Automatically navigate to dashboard if already logged in
                         setCurrentPage('dashboard');
                    } else {
                         // User is anonymous or has not filled out the login form yet
                         setAuthUser({ uid: user.uid });
                         setCurrentPage('home');
                    }
                } else {
                    // No user is signed in
                    setAuthUser(null);
                    setCurrentPage('home');
                }
                setIsAuthReady(true);
            });

            handleAuth(); // Initial authentication attempt
            return () => unsubscribe();
            
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setIsAuthReady(true);
        }
    }, []);

    // 3. Conditional Rendering based on currentPage
    const renderPage = () => {
        if (!isAuthReady) {
            return <div className="text-white text-xl">Loading application...</div>;
        }

        switch (currentPage) {
            case 'login':
                return <LoginComponent navigateTo={navigateTo} setAuthUser={setAuthUser} />;
            case 'dashboard':
                // Check if the user has completed the simulated login form (onboarded)
                if (authUser && authUser.name) {
                    return <DashboardComponent authUser={authUser} />;
                }
                // Fallback: if auth is ready but user profile is missing, go to home/login
                return <HomeComponent navigateTo={navigateTo} isAuthReady={isAuthReady} />;
            case 'home':
            default:
                return <HomeComponent navigateTo={navigateTo} isAuthReady={isAuthReady} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <header className="fixed top-0 left-0 right-0 p-4 bg-gray-800 text-white shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <span className="text-xl font-semibold">ScreenTime App</span>
                    <nav>
                        <button onClick={() => navigateTo('home')} className="mx-2 hover:text-blue-400 transition">Home</button>
                        {authUser && authUser.name && (
                            <button onClick={() => navigateTo('dashboard')} className="mx-2 hover:text-blue-400 transition">Dashboard</button>
                        )}
                        {!authUser || !authUser.name ? (
                            <button onClick={() => navigateTo('login')} className="mx-2 py-1 px-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition">Login</button>
                        ) : (
                             <span className="mx-2 text-sm text-blue-400">Hello, {authUser.name}</span>
                        )}
                    </nav>
                </div>
            </header>
            
            <main className="flex-grow flex items-center justify-center pt-20">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;