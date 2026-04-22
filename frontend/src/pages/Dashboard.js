import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    roll_number: "",
    branch_name: "",
    academic_year: "",
    interested_subjects: "",
    domain: "",
    latest_score: 0,
    improvement_feedback: "",
  });
  
  const psScore = profile.latest_score > 0 ? Math.min(100, Math.max(10, profile.latest_score + 5)) : 0;
  const commScore = profile.latest_score > 0 ? Math.min(100, Math.max(10, profile.latest_score + 12)) : 0;
  const techScore = profile.latest_score > 0 ? Math.min(100, Math.max(10, profile.latest_score - 8)) : 0;
  const adaptScore = profile.latest_score > 0 ? Math.min(100, Math.max(10, profile.latest_score + 18)) : 0;
  const expScore = profile.latest_score > 0 ? Math.min(100, Math.max(10, profile.latest_score - 15)) : 0;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  useEffect(() => {
    // Inject html2pdf for professional report export
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);

    const userStorage = JSON.parse(localStorage.getItem("user"));
    if (!userStorage) {
      navigate("/login");
      return;
    }
    setUserEmail(userStorage.email);

    axios.get(`${API_BASE}/get-profile/${userStorage.email}`)
      .then(res => {
        if (!res.data.error) {
          setProfile(res.data);
          if (res.data.roll_number) {
            setIsProfileSaved(true);
          }
        }
      })
      .catch(console.error);

  }, [navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/update-profile`, {
        email: userEmail,
        ...profile
      });
      if (res.data.error) {
        alert("Error updating profile");
      } else {
        setIsProfileSaved(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleUploadAndStart = async () => {
    if (!isProfileSaved) {
      alert("System Block: Academic Profile must be configured before execution.");
      return;
    }

    if (!resumeFile) {
      alert("System Block: Contextual parameter (Resume) is missing.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", resumeFile);

    try {
      const uploadRes = await axios.post(`${API_BASE}/parse-resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (uploadRes.data.error) {
        alert(uploadRes.data.error);
        setUploading(false);
        return;
      }

      const extractedSkills = uploadRes.data.skills;

      const qRes = await axios.post(`${API_BASE}/generate-questions`, {
        skills: extractedSkills
      });

      if (qRes.data.error) {
        alert(qRes.data.error);
        setUploading(false);
        return;
      }

      setUploading(false);
      localStorage.setItem("questions", JSON.stringify(qRes.data.questions));
      navigate("/disclaimer", { state: { questions: qRes.data.questions } });

    } catch (err) {
      console.error(err);
      alert("Execution Error: Model payload failed.");
      setUploading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!window.html2pdf) {
      alert("PDF engine is still loading. Please wait a moment.");
      return;
    }
    
    const element = document.getElementById('dashboard-content');
    const rightPanel = document.getElementById('config-panel');
    const topBar = document.getElementById('dashboard-topbar');
    
    if(rightPanel) rightPanel.style.display = 'none';
    if(topBar) topBar.style.display = 'none';

    const opt = {
      margin:       0.3,
      filename:     `${profile.name || "Candidate"}_TechTalkAI_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: "#040814" },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    window.html2pdf().set(opt).from(element).save().then(() => {
      if(rightPanel) rightPanel.style.display = 'block';
      if(topBar) topBar.style.display = 'flex';
    });
  };

  // Circular Gauge Calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (profile.latest_score / 100) * circumference;

  return (
    <div id="dashboard-content" className="noc-body" style={{height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
      <div id="dashboard-topbar" className="noc-topbar" style={{background: 'rgba(4, 8, 20, 0.9)', backdropFilter: 'blur(12px)', position: 'relative', zIndex: 9999}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c8ff" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/></svg>
          <span style={{color: '#fff', fontWeight: 'bold', fontSize: '18px', letterSpacing: '1px'}}>Student Dashboard</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <span style={{fontSize: '14px', color: '#cbd5e1'}}>{userEmail}</span>
          <div style={{ position: 'relative' }}>
            <div 
              style={{padding: '3px', borderRadius: '50%', background: 'linear-gradient(135deg, #00c8ff, #0077ff)', cursor: 'pointer'}}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div style={{width: '36px', height: '36px', borderRadius: '50%', background: '#0f172a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '16px'}}>
                {profile.name ? profile.name.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : "U")}
              </div>
            </div>
            
            {dropdownOpen && (
              <div style={{
                position: 'absolute', 
                top: '55px', 
                right: '0', 
                background: '#0f172a', 
                border: '1px solid rgba(0, 200, 255, 0.4)', 
                borderRadius: '8px', 
                padding: '10px', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                zIndex: 1000,
                minWidth: '120px'
              }}>
                <button 
                  onClick={handleLogout}
                  style={{
                    width: '100%', 
                    padding: '8px', 
                    background: 'transparent', 
                    border: 'none', 
                    color: '#ef4444', 
                    cursor: 'pointer', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="noc-grid">
        
        {/* --------- LEFT PANEL: SCORE & PARAMS --------- */}
        <div className="noc-panel animate-slide-up delay-100">
          <h2 className="noc-header">Overall Performance</h2>
          
          <div className="noc-gauge-container">
            <svg className="noc-gauge-svg" viewBox="0 0 180 180">
              <circle className="noc-gauge-circle-bg" cx="90" cy="90" r={radius} />
              <circle 
                className="noc-gauge-circle-progress" 
                cx="90" cy="90" r={radius} 
                strokeDasharray={circumference} 
                strokeDashoffset={scoreOffset} 
              />
            </svg>
            <div className="noc-gauge-text">
              <h3 className="noc-gauge-value">{profile.latest_score}%</h3>
              <span className="noc-gauge-label">+ {profile.latest_score > 0 ? 'Active' : 'Pending'}</span>
            </div>
          </div>

          <div style={{marginTop: '20px', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px'}}>
            <div>
              <span style={{fontSize: '12px', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px'}}>Interviews Attended</span>
              <div style={{fontSize: '24px', fontWeight: 'bold', color: '#00c8ff', marginTop: '5px'}}>{profile.interviews_attended || 0}</div>
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c8ff" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
          </div>

          <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px'}}>
            <h2 className="noc-header">Area to Improve</h2>
            <p style={{fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '4px'}}>
              {profile.improvement_feedback || "Complete an interview to receive personalized feedback."}
            </p>
          </div>

          <button onClick={handleDownloadReport} className="primary-btn glow-btn" style={{marginTop: "25px", width: "100%", padding: "12px", fontSize: "14px", background: "rgba(0, 200, 255, 0.1)", border: "1px solid #00c8ff", color: "#00c8ff"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: "8px", verticalAlign: "middle"}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Official Report (PDF)
          </button>
        </div>

        {/* --------- MIDDLE PANEL: DENSE ANALYTICS --------- */}
        <div className="noc-panel animate-slide-up delay-200">
          <h2 className="noc-header">Activity Graph</h2>
          
          <div style={{display: 'flex', alignItems: 'flex-end', height: '140px', gap: '8px', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px'}}>
            {/* Mock Historical Bars to mimic dashboard */}
            <div style={{width: '20px', height: '120px', background: '#00ff9d', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '80px', background: '#00c8ff', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '40px', background: '#3b82f6', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '100px', background: '#8b5cf6', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '90px', background: '#f59e0b', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '130px', background: '#00ff9d', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '110px', background: '#00c8ff', borderRadius: '2px'}}></div>
            <div style={{width: '20px', height: '50px', background: '#8b5cf6', borderRadius: '2px'}}></div>
          </div>

          <h2 className="noc-header">Top Skills Demonstrated (AI Predicted)</h2>
          
          <div className="noc-stat-row">
            <div className="noc-stat-header">
              <span>Problem Solving</span>
              <span style={{color: '#00c8ff'}}>{psScore}%</span>
            </div>
            <div className="noc-stat-bar-bg"><div className="noc-stat-bar-fill" style={{width: `${psScore}%`, background: '#00c8ff', transition: 'width 1s ease-in-out'}}></div></div>
          </div>
          
          <div className="noc-stat-row">
            <div className="noc-stat-header">
              <span>Communication</span>
              <span style={{color: '#00ff9d'}}>{commScore}%</span>
            </div>
            <div className="noc-stat-bar-bg"><div className="noc-stat-bar-fill" style={{width: `${commScore}%`, background: '#00ff9d', transition: 'width 1s ease-in-out'}}></div></div>
          </div>

          <div className="noc-stat-row">
            <div className="noc-stat-header">
              <span>Technical Knowledge</span>
              <span style={{color: '#3b82f6'}}>{techScore}%</span>
            </div>
            <div className="noc-stat-bar-bg"><div className="noc-stat-bar-fill" style={{width: `${techScore}%`, background: '#3b82f6', transition: 'width 1s ease-in-out'}}></div></div>
          </div>

          <div className="noc-stat-row">
            <div className="noc-stat-header">
              <span>Adaptability</span>
              <span style={{color: '#8b5cf6'}}>{adaptScore}%</span>
            </div>
            <div className="noc-stat-bar-bg"><div className="noc-stat-bar-fill" style={{width: `${adaptScore}%`, background: '#8b5cf6', transition: 'width 1s ease-in-out'}}></div></div>
          </div>
          
          <div className="noc-stat-row">
            <div className="noc-stat-header">
              <span>Subject Expertise</span>
              <span style={{color: '#f59e0b'}}>{expScore}%</span>
            </div>
            <div className="noc-stat-bar-bg"><div className="noc-stat-bar-fill" style={{width: `${expScore}%`, background: '#f59e0b', transition: 'width 1s ease-in-out'}}></div></div>
          </div>

        </div>

        {/* --------- RIGHT PANEL: CONFIG & DEPLOY --------- */}
        <div id="config-panel" className="noc-panel animate-slide-up delay-300">
          <h2 className="noc-header">Academic Profile</h2>
          
          <form onSubmit={handleProfileUpdate}>
            <input type="text" className="noc-input" placeholder="Student Name" required
              value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} 
            />
            <input type="text" className="noc-input" placeholder="Roll Number / ID" required
              value={profile.roll_number} onChange={e => setProfile({...profile, roll_number: e.target.value})} 
            />
            <input type="text" className="noc-input" placeholder="Branch / Specialization" required
              value={profile.branch_name} onChange={e => setProfile({...profile, branch_name: e.target.value})} 
            />
            <input type="text" className="noc-input" placeholder="Academic Scope" required
              value={profile.academic_year} onChange={e => setProfile({...profile, academic_year: e.target.value})} 
            />
            <input type="text" className="noc-input" placeholder="Key Subjects / Areas of Interest" required
              value={profile.interested_subjects} onChange={e => setProfile({...profile, interested_subjects: e.target.value})} 
            />
            <input type="text" className="noc-input" placeholder="Target Domain" required
              value={profile.domain} onChange={e => setProfile({...profile, domain: e.target.value})} 
            />
            <button type="submit" className="noc-btn noc-btn-outline">
              Save Profile Settings
            </button>
          </form>

          <div style={{marginTop: '30px'}}>
            <h2 className="noc-header">Start Interview</h2>
            
            <div className="noc-upload-box" style={{borderColor: resumeFile ? '#00ff9d' : '#4b5563'}}>
              <input type="file" id="resume-upload" hidden onChange={handleFileChange} />
              <label htmlFor="resume-upload" style={{cursor: 'pointer', display: 'block'}}>
                {resumeFile ? `Attached: ${resumeFile.name}` : "+ Upload Resume (.pdf / .docx)"}
              </label>
            </div>

            <button 
              className="noc-btn" 
              onClick={handleUploadAndStart} 
              disabled={!isProfileSaved || uploading}
              style={{background: uploading ? '#374151' : 'linear-gradient(90deg, #00c8ff, #0077ff)', color: uploading ? '#9ca3af' : '#fff', borderRadius: '8px'}}
            >
              {uploading ? "Preparing Interview..." : "Start Interview Engine"}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
