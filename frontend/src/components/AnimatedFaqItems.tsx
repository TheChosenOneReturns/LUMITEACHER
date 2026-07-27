import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { CaretDownIcon } from "./icons";
import { riseItem } from "./MotionPrimitives";

interface FaqItem {
  question: string;
  answer: string;
}

export function AnimatedFaqItems({ items }: { items: readonly FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  return items.map(({ question, answer }, index) => {
    const open = openIndex === index;
    const answerId = `faq-answer-${index}`;
    const triggerId = `faq-trigger-${index}`;

    return (
      <motion.article
        className={`landing-faq__item${open ? " is-open" : ""}`}
        key={question}
        variants={riseItem}
        layout={!reduceMotion}
        transition={{ layout: { duration: reduceMotion ? 0 : 0.28, ease: "easeOut" } }}
      >
        <button
          id={triggerId}
          className="landing-faq__item-button"
          type="button"
          aria-expanded={open}
          aria-controls={answerId}
          onClick={() => setOpenIndex(open ? null : index)}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{question}</strong>
          <motion.span
            className="landing-faq__caret"
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
            aria-hidden="true"
          >
            <CaretDownIcon weight="bold" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={answerId}
              className="landing-faq__answer-shell"
              role="region"
              aria-labelledby={triggerId}
              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduceMotion ? {} : { height: 0, opacity: 0 }}
              transition={{
                height: { duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: reduceMotion ? 0 : 0.2 },
              }}
            >
              <div className="landing-faq__answer">
                <p>{answer}</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.article>
    );
  });
}
