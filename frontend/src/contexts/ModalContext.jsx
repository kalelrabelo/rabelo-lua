import React, { createContext, useState, useContext } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({ isOpen: false, data: null, type: null });

  const openModal = (type, data) => {
    setModalState({ isOpen: true, data, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, data: null, type: null });
  };

  return (
    <ModalContext.Provider value={{ modalState, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

