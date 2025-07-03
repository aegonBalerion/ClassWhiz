import React, { useState, useContext, useEffect } from "react";
import {
  ArrowLeft,
  Bot,
  MoreVertical,
  ChevronDown,
  NotebookPen,
} from "lucide-react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import { PostApiCall } from "../utils/apiCall";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import Modal from "../components/Modal";
import { toast } from "react-toastify";

const Classroom = () => {
  const [activeTab, setActiveTab] = useState("lectures");
  const [showFilter, setShowFilter] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [tagsGroupedByLecture, setTagsGroupedByLecture] = useState([]);
  const [update, setUpdate] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [filterId, setFilterId] = useState("676dda2f2e9bba9d072d3b5d");

  const {
    user,
    selectedCourse,
    setSelectedLecture,
    setSelectedLectureId,
    selectedLectureId,
  } = useContext(UserContext);

  const navigate = useNavigate();

  const fetchLectures = async () => {
    try {
      const token = localStorage.getItem("token");
      const courseParam = selectedCourse && selectedCourse._id ? `?course=${selectedCourse._id}` : "";
      const response = await fetch(
        `http://localhost:8000/api/lecture/user${courseParam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      console.log("Lectures fetched:", result);

      if (Array.isArray(result.data?.lectures)) {
        setLectures(result.data.lectures);
      } else {
        setLectures([]);
      }
    } catch (err) {
      console.log("getLectures error", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTags = async () => {
    try {
      const response = await PostApiCall(
        "http://localhost:8000/api/tag/getAllTags",
        {
          courseID: selectedCourse._id,
          userID: user._id,
        }
      );
      setTagsGroupedByLecture(response.data.groupedByLecture);
    } catch (err) {
      console.log("getTags error", err);
    }
  };

  useEffect(() => {
    if (!selectedCourse || !user) return;
    setLoading(true);
    fetchLectures();
    fetchAllTags();
  }, [selectedCourse, user]);

  const getTagsForLecture = (lectureId) => {
    const lecture = tagsGroupedByLecture.find(
      (item) => item.lectureId === lectureId
    );
    return lecture ? lecture.tags : [];
  };

  const handleUpdateTags = async (tags, id) => {
    try {
      setLoading(true);
      const response = await PostApiCall("http://localhost:8000/api/tag", {
        TAGS: tags,
        lectureID: id,
        courseID: selectedCourse._id,
        userID: user._id,
      });

      if (response.success) {
        setUpdate(tags);
        toast.success("Tags updated");
      } else {
        toast.error("Tag update failed");
      }
    } catch (err) {
      toast.error("Error updating tags");
    } finally {
      setLoading(false);
    }
  };

  const renderOptionsMenu = (index, url, lectureid) => {
    if (showOptionsMenu !== index) return null;

    return (
      <div className="absolute right-0 top-6 rounded-lg w-40 bg-gray-300 shadow-lg z-50">
        <p className="px-4 py-2 text-black hover:bg-gray-400 cursor-pointer">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-transparent text-black"
          >
            Manage Tags
          </button>
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Manage Tags"
            initialTags={getTagsForLecture(lectureid)}
            onTagsUpdate={handleUpdateTags}
          />
        </p>
        <a href={url} download>
          <p className="px-4 py-2 text-black hover:bg-gray-400 cursor-pointer">
            Download
          </p>
        </a>
      </div>
    );
  };

  const renderContent = () => {
    if (!activeTab) return null;

    return (
      <>
        <div className="relative flex justify-end flex-col items-end">
          <div
            className="flex p-1 justify-around h-5 items-center mt-2 bg-[#ffd700] w-[18%] rounded-lg cursor-pointer"
            onClick={() => setShowFilter(!showFilter)}
          >
            <p>Filter</p>
            <ChevronDown size={16} />
          </div>
        </div>

        {(!lectures || lectures.length === 0) ? (
          <div className="text-center text-gray-300 mt-8">
            No lectures found.
          </div>
        ) : (
          lectures.map((lecture, index) => {
            const title = lecture.title || lecture.name || "Untitled";
            const link = lecture.link || lecture.files?.[0]?.url || "#";
            return (
              <div
                key={index}
                className="flex justify-between my-4 bg-[#92b3b3] p-1 rounded-lg overflow-visible"
              >
                <div className="p-1 w-[70%] rounded-lg">{title}</div>
                <div className="relative flex justify-around items-center p-1 w-1/4 bg-[#ffd700] rounded-lg h-5">
                  <NotebookPen
                    size={16}
                    className="hover:scale-150 transition-transform cursor-pointer"
                    onClick={() => {
                      setSelectedLecture(lecture);
                      navigate("/notes");
                    }}
                  />
                  <Bot
                    size={16}
                    className="hover:scale-150 transition-transform cursor-pointer"
                    onClick={() => {
                      setSelectedLecture(lecture);
                      navigate("/chatbot");
                    }}
                  />
                  <div className="relative">
                    <MoreVertical
                      size={16}
                      className="hover:scale-150 transition-transform cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsMenu(
                          showOptionsMenu === index ? null : index
                        );
                        setSelectedLectureId(lecture._id);
                      }}
                    />
                    {renderOptionsMenu(index, link, lecture._id)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {/* Debug print */}
        <pre className="text-white text-xs mt-4 max-h-32 overflow-y-scroll">
          {JSON.stringify(lectures, null, 2)}
        </pre>
      </>
    );
  };

  if (loading) {
    return (
      <div className="text-center text-white mt-8">Loading lectures...</div>
    );
  }

  if (!selectedCourse || !user) {
    return (
      <div className="text-white text-center mt-8">
        Waiting for user and course...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="w-[400px]">
        <div className="min-h-[600px] bg-[#24243e] shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 p-4 bg-[#302b63] border-b border-white/20">
            <ArrowLeft
              className="text-gray-300 hover:text-white cursor-pointer"
              size={20}
              onClick={() => navigate("/home")}
            />
            <h1 className="text-lg font-medium m-0">Your Classrooms</h1>
          </div>
          <div className="w-[95%] mx-auto flex justify-center items-center py-4">
            <h3 className="text-xl m-0">{selectedCourse.name}</h3>
          </div>
          <div className="pt-0 p-6 overflow-auto flex-1">
            <div className="flex items-center p-4 bg-[#302b63] rounded-lg shadow-inner">
              <div
                className={`w-1/3 flex justify-center cursor-pointer ${
                  activeTab === "lectures"
                    ? "text-[#ffd700]"
                    : "text-white hover:text-[#ffd700]"
                }`}
                onClick={() => setActiveTab("lectures")}
              >
                Lectures
              </div>
              <div
                className={`w-1/3 flex justify-center cursor-pointer ${
                  activeTab === "assignments"
                    ? "text-[#ffd700]"
                    : "text-white hover:text-[#ffd700]"
                }`}
                onClick={() => setActiveTab("assignments")}
              >
                Assignments
              </div>
              <div
                className={`w-1/3 flex justify-center cursor-pointer ${
                  activeTab === "misc"
                    ? "text-[#ffd700]"
                    : "text-white hover:text-[#ffd700]"
                }`}
                onClick={() => setActiveTab("misc")}
              >
                Misc
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Classroom;
