import { FiAlertCircle } from "react-icons/fi";

const NoDataWatermark = ({ text = "No Data to Display" }) => {
    return (
        <div className="relative min-h-[300px] flex items-center justify-center">
            <FiAlertCircle className="text-gray-400 text-4xl mb-2 opacity-30" />
            <span className="absolute text-gray-400 text-xl font-semibold opacity-30 select-none">
                {text}
            </span>
        </div>
    );
}
export default NoDataWatermark;
