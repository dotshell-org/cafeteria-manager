import React from "react";
import {ItemGroup} from "../../types/generic/ItemGroup";

interface ItemGroupButtonInterface {
    id: number;
    group: ItemGroup;
    onClick: (id: number) => void;
}

const ItemGroupButton: React.FC<ItemGroupButtonInterface> = ({ id, group, onClick }) => {
  return (
      <button
          className={`rounded-full text-sm py-1 px-3 mt-2 mr-2 focus:outline-none transition-all ${group.selected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          onClick={() => onClick(id)}
      >
          {group.name}
      </button>
  );
};

export default ItemGroupButton;