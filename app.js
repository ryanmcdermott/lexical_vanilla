import {
    createEditor,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_EDITOR,
    COMMAND_PRIORITY_HIGH,
    $getSelection,
    KEY_ENTER_COMMAND,
    $createParagraphNode,
    $isRangeSelection,
    OUTDENT_CONTENT_COMMAND,
    INDENT_CONTENT_COMMAND
} from "/lexical_vanilla/third_party/js/lexical/Lexical.dev.js";
import { $wrapNodes, $isAtNodeEnd, $patchStyleText } from "/lexical_vanilla/third_party/js/lexical/LexicalSelection.dev.js";
import {
    registerRichText,
    QuoteNode,
    $createQuoteNode
} from "/lexical_vanilla/third_party/js/lexical/LexicalRichText.dev.js";
import {
    LinkNode,
    toggleLink,
    TOGGLE_LINK_COMMAND,
    $isLinkNode
} from "/lexical_vanilla/third_party/js/lexical/LexicalLink.dev.js";
import {
    $isListItemNode,
    ListNode,
    ListItemNode,
    insertList,
    removeList,
} from "/lexical_vanilla/third_party/js/lexical/LexicalList.dev.js";
import {
    createEmptyHistoryState,
    undo,
    redo,
    registerHistory
} from "/lexical_vanilla/third_party/js/lexical/LexicalHistory.dev.js";

function setupEditor(initState) {
    const config = {
        namespace: "MyEditor",
        onError: console.error,
        theme: {
            text: {
                bold: "text-bold",
                italic: "text-italic",
                underline: "text-underline",
                code: 'text-code',
                highlight: 'text-highlight',
                strikethrough: 'text-strikethrough',
                subscript: 'text-subscript',
                superscript: 'text-superscript',
            },
        },
        nodes: [LinkNode, QuoteNode, ListNode, ListItemNode]
    };

    let dropdownButton = document.getElementById('dropdown-menu-btn');
    let dropdownMenu = document.getElementById('dropdownMenu');
    let popperInstance = null;

    function toggleDropdown() {
        if (dropdownMenu.style.display === 'block') {
            dropdownMenu.style.display = 'none';
            if (popperInstance) {
                popperInstance.destroy();
                popperInstance = null;
            }
        } else {
            dropdownMenu.style.display = 'block';
            popperInstance = Popper.createPopper(dropdownButton, dropdownMenu, {
                placement: 'bottom-start'
            });
        }
    }

    dropdownButton.addEventListener('click', toggleDropdown);
    let headingNormal = document.getElementById('heading-normal');
    let headingH1 = document.getElementById('heading-h1');
    let headingH2 = document.getElementById('heading-h2');
    let headingH3 = document.getElementById('heading-h3');
    let headingH4 = document.getElementById('heading-h4');

    headingNormal.addEventListener('click', (event) => {
        event.stopPropagation();
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    "font-size": "1rem"
                });
            }
        });
        toggleDropdown();
    });
    headingH1.addEventListener('click', (event) => {
        event.stopPropagation();
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    "font-size": "2.125rem"
                });
            }
        });
        toggleDropdown();
    }
    );
    headingH2.addEventListener('click', (event) => {
        event.stopPropagation();
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    "font-size": "1.875rem"
                });
            }
        });
        toggleDropdown();
    }
    );
    headingH3.addEventListener('click', (event) => {
        event.stopPropagation();
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    "font-size": "1.5rem"
                });
            }
        });
        toggleDropdown();
    }
    );
    headingH4.addEventListener('click', (event) => {
        event.stopPropagation();
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $patchStyleText(selection, {
                    "font-size": "1.25rem"
                });
            }
        });
        toggleDropdown();
    }
    );

    document.addEventListener('click', function (event) {
        var isClickInsideDropdown = dropdownButton.contains(event.target) || dropdownMenu.contains(event.target);

        if (!isClickInsideDropdown) {
            if (popperInstance) {
                popperInstance.destroy();
                popperInstance = null;
            }
            dropdownMenu.style.display = 'none';
        }
    });

    const historyState = createEmptyHistoryState();
    const editor = createEditor(config);

    const editorState = editor.parseEditorState(initState);
    editor.setEditorState(editorState);

    const el = document.getElementById("editor");
    editor.setRootElement(el);
    registerRichText(editor);
    registerHistory(editor, historyState, 1000);
    editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
            console.log($getSelection());
            console.log(JSON.stringify(editor.getEditorState()));
        });
    });

    function getSelectedNode(selection) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const anchorNode = selection.anchor.getNode();
        const focusNode = selection.focus.getNode();
        if (anchorNode === focusNode) {
            return anchorNode;
        }
        const isBackward = selection.isBackward();
        if (isBackward) {
            return $isAtNodeEnd(focus) ? anchorNode : focusNode;
        } else {
            return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
        }
    }

    editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (payload) => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
                return false;
            }
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                toggleLink(null);
            } else {
                toggleLink(node.getTextContent());
            }
            return true;
        },
        COMMAND_PRIORITY_LOW
    );

    let canUndo = false;
    let canRedo = false;

    editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
            canUndo = payload;
            return false;
        },
        COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
            canRedo = payload;
            return false;
        },
        COMMAND_PRIORITY_LOW
    );
    editor.registerCommand(
        UNDO_COMMAND,
        () => {
            undo(editor, historyState);
            return true;
        },
        COMMAND_PRIORITY_EDITOR
    );
    editor.registerCommand(
        REDO_COMMAND,
        () => {
            redo(editor, historyState);
            return true;
        },
        COMMAND_PRIORITY_EDITOR
    );
    document.getElementById("undo").addEventListener("click", () => {
        if (canUndo) {
            editor.dispatchCommand(UNDO_COMMAND, null);
        }
    });
    document.getElementById("redo").addEventListener("click", () => {
        if (canRedo) {
            editor.dispatchCommand(REDO_COMMAND, null);
        }
    });

    document.getElementById("bold").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
    });
    document.getElementById("italic").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
    });
    document.getElementById("underline").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
    });
    document.getElementById("strikethrough").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
    });
    document.getElementById("quote").addEventListener("click", () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createQuoteNode());
            }
        });
    });
    document.getElementById("paragraph").addEventListener("click", () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $wrapNodes(selection, () => $createParagraphNode());
            }
        });
    });
    document.getElementById("text-left").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
    });
    document.getElementById("text-center").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
    });
    document.getElementById("text-right").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
    });
    document.getElementById("text-justify").addEventListener("click", () => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
    });

    document.getElementById("list-ul").addEventListener("click", () => {
        insertList(editor, "bullet");
    });
    document.getElementById("list-ol").addEventListener("click", () => {
        insertList(editor, "number");
    });
    document.getElementById("list-clear").addEventListener("click", () => {
        removeList(editor);
    });

    document.getElementById("indent").addEventListener("click", () => {
        editor.dispatchCommand(INDENT_CONTENT_COMMAND, null);
    });
    document.getElementById("outdent").addEventListener("click", () => {
        editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, null);
    });

    editor.registerCommand(
        KEY_ENTER_COMMAND,
        () => {
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    $patchStyleText(selection, {
                        "font-size": "1rem"
                    });
                }
            });
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const node = selection.anchor.getNode();
                if ($isListItemNode(node) && node.getTextContent().trim() === '') {
                    editor.update(() => {
                        const paragraphNode = $createParagraphNode();
                        node.getParent().insertAfter(paragraphNode, node);
                        paragraphNode.select();
                    });
                    return true;
                }
            }
            return false;
        },
        COMMAND_PRIORITY_HIGH
    );

    function adjustMargin() {
        var toolbar = document.getElementById('toolbar');
        var editorElement = document.querySelector('#editor');

        if (toolbar && editorElement) {
            var toolbarHeight = toolbar.offsetHeight;
            editorElement.style.marginTop = toolbarHeight + 'px';
        }
    }

    window.onload = adjustMargin;
    window.onresize = adjustMargin;

    var resizeObserver = new ResizeObserver(function (entries) {
        adjustMargin();
    });

    var toolbar = document.getElementById('toolbar');
    resizeObserver.observe(toolbar);
}

fetch('/lexical_vanilla/example_init_state.json')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        setupEditor(data);
    })
    .catch(error => {
        console.error('There was a problem fetching the data:', error);
    });
