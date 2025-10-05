import React from 'react';
import { AppProvider, useAppContext } from './state/AppContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import SettingsPanel from './components/settings/SettingsPanel';
import HistoryPanel from './components/history/HistoryPanel';
import ExportModal from './components/modals/ExportModal';
import BranchingModal from './components/modals/BranchingModal';
import ImagePreviewModal from './components/modals/ImagePreviewModal';
import SceneSelectionModal from './components/modals/SceneSelectionModal';
import GoalAssignmentModal from './components/modals/GoalAssignmentModal';
import SideConversationModal from './components/modals/SideConversationModal';
import HelpModal from './components/modals/HelpModal';
import BadgeToast from './components/badges/BadgeToast';
import ImageEditModal from './components/modals/ImageEditModal';
import ViewRouter from './components/ViewRouter';

const Toast: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(onClose, 6000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed bottom-4 right-4 bg-red-900/90 border border-red-700/60 rounded-lg p-4 shadow-lg backdrop-blur flex items-center gap-3 z-[200] animate-[slideIn_0.5s_ease-out]">
            <div className="text-xl">⚠️</div>
            <div className="text-sm text-red-200 flex-1">{message}</div>
            <button onClick={onClose} className="ml-3 text-2xl text-red-200/80 hover:text-white" aria-label="Close notification">&times;</button>
        </div>
    );
};


const AppContent: React.FC = () => {
    const {
        showHexGrid,
        sidebar,
        setSidebar,
        sessionToExport,
        setSessionToExport,
        branchingModalState,
        handleCloseBranchModal,
        handleCreateBranch,
        previewImageUrl,
        setPreviewImageUrl,
        imageToEdit,
        setImageToEdit,
        handleEditImage,
        isEditingImage,
        isSceneModalOpen,
        setIsSceneModalOpen,
        handleSetScene,
        isGoalModalOpen,
        setIsGoalModalOpen,
        handleAssignGoals,
        isSideConvoModalOpen,
        setIsSideConvoModalOpen,
        handleTriggerSideConversation,
        isHelpModalOpen,
        setIsHelpModalOpen,
        toastMessage,
        setToastMessage,
        apiKey,
        setApiKey,
        usage,
        limits,
        setLimits,
        dryRun,
        setDryRun,
        killSwitch,
        setKillSwitch,
        resetUsage,
        setShowHexGrid,
        userPreferences,
        setUserPreferences,
        addTelemetry,
        sessions,
        activeSessionId,
        loadSession,
        deleteSession,
        handleOpenExportModal,
        handleExtractLore,
        isScanningLore,
        importSession,
    } = useAppContext();
    
    return (
        <div className={`text-white min-h-screen font-sans ${showHexGrid ? 'hex-bg' : ''}`}>
            <Header />
            <main className="p-4 sm:p-8">
                <ViewRouter />
            </main>
            <Sidebar isOpen={sidebar !== null} onClose={() => setSidebar(null)}>
                {sidebar === 'settings' && <SettingsPanel 
                    apiKey={apiKey}
                    setApiKey={setApiKey}
                    usage={usage}
                    limits={limits}
                    setLimits={setLimits}
                    dryRun={dryRun}
                    setDryRun={setDryRun}
                    killSwitch={killSwitch}
                    setKillSwitch={setKillSwitch}
                    resetUsage={resetUsage}
                    showHexGrid={showHexGrid}
                    setShowHexGrid={setShowHexGrid}
                    userPreferences={userPreferences}
                    onUpdateUserPreferences={setUserPreferences}
                    onAddTelemetry={activeSessionId ? (e) => addTelemetry(activeSessionId, e) : undefined}
                />}
                {sidebar === 'history' && <HistoryPanel 
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onLoadSession={loadSession}
                    onDeleteSession={deleteSession}
                    onOpenExport={handleOpenExportModal}
                    onExtractLore={handleExtractLore}
                    isScanningLore={isScanningLore}
                    onImportSession={importSession}
                />}
            </Sidebar>
            
            {/* Modals */}
            {sessionToExport && <ExportModal session={sessionToExport} onClose={() => setSessionToExport(null)} />}
            {branchingModalState.isOpen && branchingModalState.sourceMessage && <BranchingModal isOpen={branchingModalState.isOpen} onClose={handleCloseBranchModal} onSubmit={handleCreateBranch} sourceMessage={branchingModalState.sourceMessage} />}
            {previewImageUrl && <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />}
            {imageToEdit && <ImageEditModal isOpen={!!imageToEdit} imageUrl={imageToEdit.imageUrl} onClose={() => setImageToEdit(null)} onSubmit={handleEditImage} isSubmitting={isEditingImage} />}
            {isSceneModalOpen && <SceneSelectionModal isOpen={isSceneModalOpen} onClose={() => setIsSceneModalOpen(false)} onSelectScene={handleSetScene} />}
            {isGoalModalOpen && <GoalAssignmentModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onAssignGoals={handleAssignGoals} />}
            {isSideConvoModalOpen && <SideConversationModal isOpen={isSideConvoModalOpen} onClose={() => setIsSideConvoModalOpen(false)} onSubmit={handleTriggerSideConversation} />}
            {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />}
            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
            <BadgeToast />
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};

export default App;