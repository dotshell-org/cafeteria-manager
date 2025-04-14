import React from "react";

interface SearchBarProps {
    placeholder?: string;
    onSearch: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "", onSearch }) => {

    const [searchTerm, setSearchTerm] = React.useState("");

    const handleSearch = (e: React.FormEvent) => {
        setSearchTerm((e.target as HTMLInputElement).value)
        onSearch((e.target as HTMLInputElement).value);
    };

    return (
        <div className="relative w-full shadow rounded-lg">
            <form className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                    </svg>
                </div>
                <input
                    type="search"
                    className="w-full p-2.5 pl-10 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500 dark:focus:border-blue-500 outline-none transition-all"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </form>
        </div>
    );
};

export default SearchBar;