import FamilyTreeSelection from "./FamilyTreeSelection";
import FamilyTreePage from "./FamilyTreePage";
import { useAppSelector } from "@/hooks/redux";

const MainFamilyTreePage = () => {
    
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

    return (
        <>
            {!selectedFamilyTree ? (
                <FamilyTreeSelection />
            ) : (
                <FamilyTreePage />
            )}
        </>
    );
};

export default MainFamilyTreePage;