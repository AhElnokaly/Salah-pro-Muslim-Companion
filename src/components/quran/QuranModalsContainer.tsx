/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { QuranKhatma } from '../../types';
import KhatmaCelebrationModal from './KhatmaCelebrationModal';
import VerseCardMaker from './VerseCardMaker';
import {
  AnnualGoalModal,
  CreateKhatmaModal,
  UpdatePageModal,
  CatchUpModal,
  AttributionChoiceModal,
} from './QuranModals';

interface QuranModalsContainerProps {
  showGoalModal: boolean;
  onCloseGoalModal: () => void;
  currentHijriYear: number;
  goalInput: number;
  setGoalInput: (val: number) => void;
  onSaveGoal: (e: React.FormEvent) => void;

  showAddKhatma: boolean;
  onCloseAddKhatma: () => void;
  khatmaName: string;
  setKhatmaName: (val: string) => void;
  durationDays: number;
  setDurationDays: (val: number) => void;
  onCreateKhatma: (e: React.FormEvent) => void;

  updatingKhatmaId: string | null;
  onCloseUpdatePage: () => void;
  newPageVal: number;
  setNewPageVal: (val: number) => void;
  onUpdatePage: (e: React.FormEvent) => void;

  showCatchUpModal: boolean;
  onCloseCatchUpModal: () => void;
  activeKhatma: QuranKhatma | undefined;
  onApplyExtendDays: (addDays: number) => void;

  celebrationKhatma: QuranKhatma | null;
  onCloseCelebration: () => void;
  onShareKhatma: () => void;

  pendingUserChoiceKhatma: { khatma: QuranKhatma; years: number[] } | null;
  onChooseYear: (year: number) => void;

  showVerseCardMaker: boolean;
  onCloseVerseCardMaker: () => void;
}

export const QuranModalsContainer: React.FC<QuranModalsContainerProps> = ({
  showGoalModal,
  onCloseGoalModal,
  currentHijriYear,
  goalInput,
  setGoalInput,
  onSaveGoal,
  showAddKhatma,
  onCloseAddKhatma,
  khatmaName,
  setKhatmaName,
  durationDays,
  setDurationDays,
  onCreateKhatma,
  updatingKhatmaId,
  onCloseUpdatePage,
  newPageVal,
  setNewPageVal,
  onUpdatePage,
  showCatchUpModal,
  onCloseCatchUpModal,
  activeKhatma,
  onApplyExtendDays,
  celebrationKhatma,
  onCloseCelebration,
  onShareKhatma,
  pendingUserChoiceKhatma,
  onChooseYear,
  showVerseCardMaker,
  onCloseVerseCardMaker,
}) => {
  return (
    <>
      {/* POPUP: Annual Goal Form Modal */}
      <AnnualGoalModal
        isOpen={showGoalModal}
        onClose={onCloseGoalModal}
        currentHijriYear={currentHijriYear}
        goalInput={goalInput}
        setGoalInput={setGoalInput}
        onSaveGoal={onSaveGoal}
      />

      {/* POPUP: Create Khatma Modal */}
      <CreateKhatmaModal
        isOpen={showAddKhatma}
        onClose={onCloseAddKhatma}
        khatmaName={khatmaName}
        setKhatmaName={setKhatmaName}
        durationDays={durationDays}
        setDurationDays={setDurationDays}
        onCreateKhatma={onCreateKhatma}
      />

      {/* POPUP: Update Current Page Modal */}
      <UpdatePageModal
        isOpen={!!updatingKhatmaId}
        onClose={onCloseUpdatePage}
        newPageVal={newPageVal}
        setNewPageVal={setNewPageVal}
        onUpdatePage={onUpdatePage}
      />

      {/* POPUP: Catch Up Assistant Modal */}
      <CatchUpModal
        isOpen={showCatchUpModal}
        onClose={onCloseCatchUpModal}
        activeKhatma={activeKhatma}
        onApplyExtendDays={onApplyExtendDays}
      />

      {/* POPUP: Khatma Completion Celebration Modal */}
      {celebrationKhatma && (
        <KhatmaCelebrationModal
          khatma={celebrationKhatma}
          onClose={onCloseCelebration}
          onShareKhatma={onShareKhatma}
        />
      )}

      {/* POPUP: 50/50 Hijri Year Attribution User Choice Modal */}
      <AttributionChoiceModal
        pendingChoice={pendingUserChoiceKhatma}
        onChooseYear={onChooseYear}
      />

      {/* STANDALONE VERSE CARD MAKER MODAL */}
      {showVerseCardMaker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-xl my-auto animate-fadeIn">
            <VerseCardMaker
              onClose={onCloseVerseCardMaker}
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default QuranModalsContainer;
