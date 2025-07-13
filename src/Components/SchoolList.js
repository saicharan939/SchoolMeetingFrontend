// frontend/src/Components/SchoolList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SchoolList.css';

// Define the API URL using an environment variable
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

function SchoolList() {
  const [schools, setSchools] = useState([]);
  const navigate = useNavigate();

  const [checkboxStatus, setCheckboxStatus] = useState({});

  useEffect(() => {
    // Use the environment variable for the backend URL
    axios.get(`${BACKEND_API_URL}/api/schools`)
      .then(res => {
        setSchools(res.data);
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
  }, []);

  const handleCheckboxChange = (schoolId, checkboxName) => {
    setCheckboxStatus(prevStatus => ({
      ...prevStatus,
      [schoolId]: {
        ...prevStatus[schoolId],
        [checkboxName]: !prevStatus[schoolId][checkboxName],
      },
    }));
  };

  const handleGoToMeeting = (id) => {
    const currentSchoolCheckboxStatus = checkboxStatus[id];
    if (
      currentSchoolCheckboxStatus &&
      currentSchoolCheckboxStatus.approvalByShruthi &&
      currentSchoolCheckboxStatus.databaseReady &&
      currentSchoolCheckboxStatus.conditionsMet
    ) {
      navigate(`/schedule/`);
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
            <th>Conditions</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school) => (
            <tr key={school.id}>
              <td>{school.id}</td>
              {/* Corrected column names based on your database schema */}
              <td>{school.school_name}</td> {/* Using school_name */}
              <td>{school.contact_person}</td> {/* Using contact_person */}
              <td>{school.display_name}</td> {/* Assuming display_name is for the 'School' column based on your insert values */}
              <td>{school.address}</td>
              <td>{school.phone_number}</td> {/* Using phone_number */}
              <td>{school.email}</td>
              <td>{school.student_count}</td> {/* Using student_count */}
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