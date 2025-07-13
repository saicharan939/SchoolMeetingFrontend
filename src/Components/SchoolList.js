// frontend/src/Components/SchoolList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SchoolList.css'; // Import component-specific CSS

function SchoolList() {
  const [schools, setSchools] = useState([]); // State to store the list of schools
  const navigate = useNavigate(); // Hook for programmatic navigation

  // State to track the status of the three checkboxes for each school
  // Format: { schoolId: { approvalByShruthi: false, databaseReady: false, conditionsMet: false } }
  const [checkboxStatus, setCheckboxStatus] = useState({});

  // Fetch school data when the component mounts
  useEffect(() => {
    axios.get('http://192.168.1.22:3001/api/schools')
      .then(res => {
        setSchools(res.data);
        // Initialize checkbox status for each school
        const initialCheckboxStatus = {};
        res.data.forEach(school => {
          initialCheckboxStatus[school.id] = {
            approvalByShruthi: false,
            databaseReady: false,
            conditionsMet: false,
          };
        });
        setCheckboxStatus(initialCheckboxStatus);
      })
      .catch(err => console.error("Error fetching schools:", err));
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle checkbox change for a specific school and checkbox name
  const handleCheckboxChange = (schoolId, checkboxName) => {
    setCheckboxStatus(prevStatus => ({
      ...prevStatus,
      [schoolId]: {
        ...prevStatus[schoolId],
        [checkboxName]: !prevStatus[schoolId][checkboxName], // Toggle the checkbox state
      },
    }));
  };

  // Navigate to the MeetingApp for a specific school
  const handleGoToMeeting = (id) => {
    // Check if all three checkboxes are checked for the specific school
    const currentSchoolCheckboxStatus = checkboxStatus[id];
    if (
      currentSchoolCheckboxStatus &&
      currentSchoolCheckboxStatus.approvalByShruthi &&
      currentSchoolCheckboxStatus.databaseReady &&
      currentSchoolCheckboxStatus.conditionsMet
    ) {
      navigate(`/schedule/`); // Navigate to the meeting schedule page
    } else {
      alert('Please ensure all conditions (Approval by Shruthi, Database Ready, Conditions Met) are checked before initiating a meeting.');
    }
  };

  return (
    <div className="container">
      <h2>School Records</h2>
      <table className="school-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Principal</th>
            <th>School</th>
            <th>Address</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Students</th>
            <th>Conditions</th> {/* New column for checkboxes */}
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => (
            <tr key={school.id}>
              <td>{school.id}</td>
              <td>{school.name}</td>
              <td>{school.principal}</td>
              <td>{school.school_name}</td>
              <td>{school.address}</td>
              <td>{school.phone_no}</td>
              <td>{school.email}</td>
              <td>{school.num_students}</td>
              {/* Checkboxes for conditions */}
              <td className="checkbox-column">
                <label>
                  <input
                    type="checkbox"
                    checked={checkboxStatus[school.id]?.approvalByShruthi || false}
                    onChange={() => handleCheckboxChange(school.id, 'approvalByShruthi')}
                  />
                  Approval by Shruthi
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checkboxStatus[school.id]?.databaseReady || false}
                    onChange={() => handleCheckboxChange(school.id, 'databaseReady')}
                  />
                  Database Ready
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={checkboxStatus[school.id]?.conditionsMet || false}
                    onChange={() => handleCheckboxChange(school.id, 'conditionsMet')}
                  />
                  Conditions Met
                </label>
              </td>
              <td>
                <button
                  className="action-btn"
                  onClick={() => handleGoToMeeting(school.id)}
                  // The button is disabled unless all checkboxes for this school are checked
                  disabled={
                    !(checkboxStatus[school.id]?.approvalByShruthi &&
                      checkboxStatus[school.id]?.databaseReady &&
                      checkboxStatus[school.id]?.conditionsMet)
                  }
                >
                  Initiate Meeting
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SchoolList;
