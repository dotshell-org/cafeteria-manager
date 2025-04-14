import ItemGroupButton from "./ItemGroupButton.tsx";
import React from "react";
import {ItemGroup} from "../../types/generic/ItemGroup.ts";

interface ItemGroupChoiceBarInterface {
    groups: ItemGroup[];
    onGroupSelected: (id: number) => void;
}

const ItemGroupChoiceBar: React.FC<ItemGroupChoiceBarInterface> = ({ groups, onGroupSelected }) => {
    return (
        <div className="mt-0.5">
            {
                groups.map((group, index: number) => (
                    <ItemGroupButton group={group} onClick={(id: number) => onGroupSelected(id)} id={index} />
                ))
            }
        </div>
    )
}

export default ItemGroupChoiceBar;