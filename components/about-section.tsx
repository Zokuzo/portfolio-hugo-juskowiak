"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { Dumbbell, Globe, Award } from "lucide-react"

export function AboutSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="about" ref={ref} className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
            About <span className="text-primary glow-text">Me</span>
          </h2>

          <Card className="bg-card/50 backdrop-blur-sm border-border p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 text-lg text-muted-foreground leading-relaxed"
            >
              <p>
                I'm a junior engineer specialized in Machine Learning, Data Engineering, and Cloud Computing. I'm
                passionate about scalable distributed systems and intelligent automation, with experience in optimizing
                computing resources and developing robust full-stack solutions that bridge AI and software engineering.
              </p>

              <p>
                At Sophia Genetics, I designed and deployed machine learning systems predicting task-level memory usage
                in bioinformatics pipelines, built scalable ETL data pipelines, and implemented context-aware resource
                prediction to enhance accuracy and scalability. I optimized distributed resource allocation, cutting
                cloud costs and runtime, and presented my results to all engineering teams in a company Tech-Talk.
              </p>

              <p>
                I'm driven by the challenge of building systems that not only scale but also learn and adapt. Whether
                it's architecting data pipelines, training ML models, or deploying cloud infrastructure, I approach each
                project with a commitment to technical excellence and continuous improvement.
              </p>

              <p>
                Beyond code, I'm multilingual (French native, English fluent, Spanish B2, Japanese notions) and deeply
                passionate about sports and health, having trained for years in bodybuilding under a 2023 powerlifting
                world champion.
              </p>
            </motion.div>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <Card className="bg-card/30 backdrop-blur-sm border-border p-6 hover:border-primary transition-all duration-300">
              <Globe className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Multilingual</h3>
              <p className="text-sm text-muted-foreground">
                French (Native), English (Fluent), Spanish (B2), Japanese (Notions)
              </p>
            </Card>

            <Card className="bg-card/30 backdrop-blur-sm border-border p-6 hover:border-primary transition-all duration-300">
              <Dumbbell className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Sports & Health</h3>
              <p className="text-sm text-muted-foreground">
                Years of bodybuilding, coached by a 2023 powerlifting world champion
              </p>
            </Card>

            <Card className="bg-card/30 backdrop-blur-sm border-border p-6 hover:border-primary transition-all duration-300">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Creator</h3>
              <p className="text-sm text-muted-foreground">
                Developed three strength-training programs for intermediate athletes
              </p>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
