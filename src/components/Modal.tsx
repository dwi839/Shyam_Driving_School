import type { ReactNode } from "react";
import { S } from "../styles/styles";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalCard} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
