"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { LogOut, User, ArrowRight, Lock, Plus, Edit, Trash2, Save, X, FileText, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import axios from "axios"
import { toast } from "react-hot-toast"

// API base URL
const API_URL = "http://localhost:5000/api"

interface Question {
  _id: string
  section: string
  text: string
  options?: string[]
  answer?: string
  description?: string
  constraints?: string[]
  examples?: { input: string; output: string }[]
  testCases?: { input: string; output: string; isHidden: boolean }[]
  createdBy: string
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface Submission {
  _id: string
  user: {
    _id: string
    email: string
  }
  answers: {
    question: string
    answer: string
    isCorrect: boolean
  }[]
  score: number
  status: string
  startTime: string
  endTime?: string
}

const SECTIONS = ["mcqs", "aptitude", "ai", "coding"]

const AdminPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    section: "",
    text: " ",
    options: ["", "", "", ""],
    answer: "",
    description: "",
    constraints: [""],
    examples: [{ input: "", output: "" }],
    testCases: [{ input: "", output: "", isHidden: false }],
  })
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  })

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common["Authorization"]
    }
  }, [token])

  useEffect(() => {
    if (isLoggedIn) {
      fetchQuestions()
      fetchUsers()
      fetchSubmissions()
    }
  }, [isLoggedIn])

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_URL}/questions/`)
      setQuestions(response.data)
    } catch (error) {
      toast.error("Failed to fetch questions")
      console.error("Error fetching questions:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`)
      setUsers(response.data.users)
    } catch (error) {
      toast.error("Failed to fetch users")
      console.error("Error fetching users:", error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/exams`)
      setSubmissions(response.data.exams)
    } catch (error) {
      toast.error("Failed to fetch submissions")
      console.error("Error fetching submissions:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      })

      const { token } = response.data
      setToken(token)
      setIsLoggedIn(true)
      toast.success("Successfully logged in")
    } catch (error) {
      toast.error("Invalid credentials")
      console.error("Login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setToken("")
    setEmail("")
    setPassword("")
    setQuestions([])
    setUsers([])
    setSubmissions([])
    toast.success("Logged out successfully")
  }

  const handleAddQuestion = async () => {
    if (!newQuestion.text || newQuestion.text.trim() === "") {
      toast.error("Question text is required")
      return
    }

    if (newQuestion.section === "mcqs" || newQuestion.section === "ai" || newQuestion.section === "aptitude") {
      const validOptions = newQuestion.options?.filter((option) => option.trim() !== "")
      if (!validOptions || validOptions.length < 4) {
        toast.error("4 non-empty options are required for MCQs, AI, and Aptitude questions")
        return
      }
    }

    try {
      // Remove empty fields from the newQuestion object
      const questionToSend = { ...newQuestion }

      // Filter out empty test cases
      if (questionToSend.testCases) {
        questionToSend.testCases = questionToSend.testCases.filter(
          (testCase) => testCase.input.trim() !== "" && testCase.output.trim() !== "",
        )
      }

      // Remove empty constraints
      if (questionToSend.constraints) {
        questionToSend.constraints = questionToSend.constraints.filter((constraint) => constraint.trim() !== "")
      }

      // Remove empty examples
      if (questionToSend.examples) {
        questionToSend.examples = questionToSend.examples.filter(
          (example) => example.input.trim() !== "" || example.output.trim() !== "",
        )
      }

      console.log("Sending question data:", questionToSend) // Log the data being sent

      const response = await axios.post(`${API_URL}/questions/`, questionToSend)
      const addedQuestion = response.data
      setQuestions([...questions, addedQuestion])
      setNewQuestion({
        section: "",
        text: "",
        options: ["", "", "", ""],
        answer: "",
        description: "",
        constraints: [""],
        examples: [{ input: "", output: "" }],
        testCases: [{ input: "", output: "", isHidden: false }],
      })
      toast.success(`Question "${addedQuestion.text}" added successfully`)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("Server response:", error.response.data)
        toast.error(`Failed to add question: ${error.response.data.message || "Unknown error"}`)
      } else {
        console.error("Error adding question:", error)
        toast.error("Failed to add question: Unknown error")
      }
    }
  }

  const handleUpdateQuestion = async () => {
    if (editingQuestion) {
      try {
        const response = await axios.put(`${API_URL}/questions/${editingQuestion._id}`, editingQuestion)
        setQuestions(questions.map((q) => (q._id === editingQuestion._id ? response.data : q)))
        setEditingQuestion(null)
        toast.success("Question updated successfully")
      } catch (error) {
        toast.error("Failed to update question")
        console.error("Error updating question:", error)
      }
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/questions/${id}`)
      setQuestions(questions.filter((q) => q._id !== id))
      toast.success("Question deleted successfully")
    } catch (error) {
      toast.error("Failed to delete question")
      console.error("Error deleting question:", error)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${API_URL}/auth/register`, newUser)
      setUsers([...users, response.data])
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "user",
      })
      toast.success("User added successfully")
    } catch (error) {
      toast.error("Failed to add user")
      console.error("Error adding user:", error)
    }
  }

  const handleEditUser = (user: User) => {
    // Implement edit user functionality
    console.log("Edit user:", user)
    // You can open a modal or navigate to an edit page
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_URL}/admin/users/${userId}`)
        setUsers(users.filter((user) => user._id !== userId))
        toast.success("User deleted successfully")
      } catch (error) {
        toast.error("Failed to delete user")
        console.error("Error deleting user:", error)
      }
    }
  }

  const handleSectionClick = (section: string) => {
    setActiveSection(section === activeSection ? null : section)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-8 -left-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

          <div className="relative bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-[1.02]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LNRS Admin Portal
              </h2>
              <p className="text-gray-600 mt-2">Sign in to manage questions and users</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-8">
      <div className="max-w-7xl mx-auto bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-5 w-5" />
            <span>Log Out</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            onClick={() => handleSectionClick("questions")}
            variant={activeSection === "questions" ? "default" : "outline"}
            className="w-full"
          >
            <Edit className="w-4 h-4 mr-2" />
            Question Management
          </Button>
          <Button
            onClick={() => handleSectionClick("users")}
            variant={activeSection === "users" ? "default" : "outline"}
            className="w-full"
          >
            <User className="w-4 h-4 mr-2" />
            User Management
          </Button>
          <Button
            onClick={() => handleSectionClick("submissions")}
            variant={activeSection === "submissions" ? "default" : "outline"}
            className="w-full"
          >
            <FileText className="w-4 h-4 mr-2" />
            Exam Submissions
          </Button>
          <Button
            onClick={() => handleSectionClick("signup")}
            variant={activeSection === "signup" ? "default" : "outline"}
            className="w-full"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </div>

        {activeSection === "questions" && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newQuestion.section}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  placeholder="Question text"
                  required
                />

                {(newQuestion.section === "mcqs" ||
                  newQuestion.section === "ai" ||
                  newQuestion.section === "aptitude") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {newQuestion.options?.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(newQuestion.options || [])]
                            newOptions[index] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOptions })
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                    <Input
                      value={newQuestion.answer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                      placeholder="Correct answer"
                    />
                  </div>
                )}

                {newQuestion.section === "coding" && (
                  <div className="space-y-4">
                    {/* <Textarea
                      value={newQuestion.description}
                      onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                      placeholder="Problem description"
                      className="min-h-[100px]"
                    /> */}

                    <div className="space-y-2">
                      <h3 className="font-medium">Constraints</h3>

                      {newQuestion.constraints?.map((constraint, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={constraint}
                            onChange={(e) => {
                              const newConstraints = [...(newQuestion.constraints || [])]
                              newConstraints[index] = e.target.value
                              setNewQuestion({ ...newQuestion, constraints: newConstraints })
                            }}
                            placeholder={`Constraint ${index + 1}`}
                          />
                          {index === (newQuestion.constraints?.length || 0) - 1 && (
                            <Button
                              onClick={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  constraints: [...(newQuestion.constraints || []), ""],
                                })
                              }
                              variant="outline"
                              size="icon"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-medium">Test Cases</h3>
                      {newQuestion.testCases?.map((testCase, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                          <div>
                            <label className="text-sm text-gray-600">Input</label>
                            <Input
                              value={testCase.input}
                              onChange={(e) => {
                                const newTestCases = [...(newQuestion.testCases || [])]
                                newTestCases[index].input = e.target.value
                                setNewQuestion({ ...newQuestion, testCases: newTestCases })
                              }}
                              placeholder="Input"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600">Expected Output</label>
                            <Input
                              value={testCase.output}
                              onChange={(e) => {
                                const newTestCases = [...(newQuestion.testCases || [])]
                                newTestCases[index].output = e.target.value
                                setNewQuestion({ ...newQuestion, testCases: newTestCases })
                              }}
                              placeholder="Output"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        onClick={() =>
                          setNewQuestion({
                            ...newQuestion,
                            testCases: [...(newQuestion.testCases || []), { input: "", output: "", isHidden: false }],
                          })
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Test Case
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button onClick={handleAddQuestion} className="mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-6">Existing Questions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SECTIONS.map((section) => (
                  <div key={section} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">{section.toUpperCase()}</h3>
                    <div className="space-y-4">
                      {Array.isArray(questions) && questions.length > 0 ? (
                        questions
                          .filter((q) => q.section === section)
                          .map((question) => (
                            <div
                              key={question._id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{question.text}</p>
                                  <p className="text-sm text-gray-500 mt-1">Type: {question.section}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button onClick={() => setEditingQuestion(question)} variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteQuestion(question._id)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-500">No questions available.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === "users" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={`user-row-${user._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div key={`user-id-${user._id}`} className="text-sm font-medium text-gray-900">
                          {user._id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div key={`user-name-${user._id}`} className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div key={`user-email-${user._id}`} className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          key={`user-role-${user._id}`}
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          key={`edit-button-${user._id}`}
                          onClick={() => handleEditUser(user)}
                          variant="outline"
                          size="sm"
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          key={`delete-button-${user._id}`}
                          onClick={() => handleDeleteUser(user._id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "submissions" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">Exam Submissions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{submission.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.score}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            submission.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(submission.startTime).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === "signup" && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-6">Add New User</h2>
            <form onSubmit={handleAddUser} className="max-w-md space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPortal

