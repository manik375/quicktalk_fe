import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";

export default function AuthLayout({
  children,
  title,
  subtitle,
  linkText,
  linkPath,
}) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`flex min-h-screen ${
        darkMode ? "dark bg-dark-100" : "bg-light-100"
      }`}
    >
      <div className="m-auto w-full max-w-md p-6">
        <div
          className={`neumorphic dark:neumorphic-dark p-8 rounded-xl transition-colors duration-300`}
        >
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>

          <h1
            className={`text-2xl font-bold text-center mb-2 ${
              darkMode ? "text-white" : "text-gray-800"
            }`}
          >
            {title}
          </h1>
          <p
            className={`text-center mb-6 ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {subtitle}
          </p>

          {children}

          <div className="mt-4 text-center">
            <Link
              to={linkPath}
              className={`${
                darkMode
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-800"
              } underline`}
            >
              {linkText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
