# Cafeteria Manager

A modern cafeteria management software, compatible with Glome. Built with Electron, React, TypeScript, and Vite.

## ✨ Features

*   **Order Management:** Create, view, and manage customer orders.
*   **History Tracking:** Browse past orders grouped by date.
*   **Product Catalog:** (Assuming) Manage cafeteria items and prices.
*   **Modern UI:** Built with React and styled with Tailwind CSS.
*   **Cross-platform:** Runs on Windows, macOS, and Linux thanks to Electron.
*   **Multi-language Support:** Uses i18next for internationalization.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (Check `package.json` for recommended version, e.g., v18 or later)
*   [npm](https://www.npmjs.com/) (Usually comes bundled with Node.js)
*   [Git](https://git-scm.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dotshell-org/cafeteria-manager
    cd cafeteria-manager
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

*   **Development Mode:**
    ```bash
    npm run dev 
    ```
    This command starts the Vite development server for the renderer process and runs the Electron main process. It typically enables features like Hot Module Replacement (HMR).

*   **Building for Production:**
    ```bash
    npm run build
    ```
    This command bundles the React application and prepares the Electron app for packaging. Look for output in a `dist`, `release`, or similar directory as configured in `electron-builder` settings (likely in `package.json` or a dedicated config file).

## 💻 Technology Stack

*   **Core Framework:** [Electron](https://www.electronjs.org/)
*   **UI Library:** [React](https://reactjs.org/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool / Bundler:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animation:** [Framer Motion](https://www.framer.com/motion/)
*   **Internationalization (i18n):** [i18next](https://www.i18next.com/) with `react-i18next` and specific backends.
*   **Database:** SQLite via `better-sqlite3`
*   **Packaging:** [Electron Builder](https://www.electron.build/)
*   **Linting:** [ESLint](https://eslint.org/) with TypeScript plugins.

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you plan to contribute, please:
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
