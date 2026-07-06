import React from 'react'
import { Link } from 'react-router-dom'

const PageNotFound = () => {
  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 ">
          <div className="text-center">
              <h1 className="text-9xl font-extrabold text-gray-400">404</h1>
              <p className="text-2xl md:text-3xl font-semibold mt-4 text-gray-700">
                  Oops! Page not found.
              </p>
              <p className="mt-2 text-gray-500">
                  The page you are looking for doesn’t exist or has been moved.
              </p>
              <Link
                  to="/"
                  className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                  Go Home
              </Link>
          </div>
      </div>
  )
}

export default PageNotFound