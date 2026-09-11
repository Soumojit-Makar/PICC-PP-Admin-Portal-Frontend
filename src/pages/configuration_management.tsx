import ConfigServerManagement from "./config_server";
import DomainManagement from "./domain";
// import ModelConfigManagement from "./model_config";
import ModelDetailsManagement from "./model_details";
import HaproxyManagement from "./haproxy_management";
export type FormModeType = 'new' | 'edit';

const ConfigurationManagement = () => {

    return (
        <div className="h-full flex flex-col gap-6 p-4 overflow-y-auto">
            {/* Top Row - Config Server & Domain */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Config Server */}
                <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
                    <ConfigServerManagement />
                </div>

                {/* Right Column - Domain */}
                <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4">
                    <DomainManagement />
                </div>
            </div>

            {/* Middle Row - Model Details Management (Full Width) */}
            <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4 min-h-[420px]">
                <ModelDetailsManagement />
            </div>

            {/* Bottom Row - HAProxy Configuration Management (Full Width Single Grid) */}
            <div className="flex flex-col bg-white dark:bg-transparent border dark:border-gray-700 rounded-2xl shadow dark:shadow-none p-4 min-h-[550px]">
                <HaproxyManagement />
            </div>
        </div>
    );
}

export default ConfigurationManagement;