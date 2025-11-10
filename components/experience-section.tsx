"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { Briefcase, Calendar } from "lucide-react"

const experiences = [
  {
    title: "Software Development Engineer Intern",
    company: "Sophia Genetics",
    period: "Apr 2025 – Sep 2025",
    description:
      "Designed and deployed a machine learning system (XGBoost, LightGBM, CatBoost, Random Forest) predicting task-level memory usage in bioinformatics pipelines. Built scalable ETL/data pipelines using Python, Pandas, ElasticSearch, and Azure Blob Storage.",
    achievements: [
      "Implemented context-aware resource prediction leveraging task sequencing and metadata to enhance accuracy and scalability",
      "Optimized distributed resource allocation, cutting cloud costs and runtime via GitLab CI/CD and agile workflows",
      "Presented results in a company Tech-Talk to all engineering teams",
    ],
  },
  {
    title: "Software Development Engineer Intern",
    company: "The Guill Corp",
    period: "Feb 2023 – Apr 2023, Jun 2023 – Jul 2023",
    description:
      "Created an interface to manage machining programming data. Self-taught advanced Python (Flask), JavaScript (jQuery/Ajax), SQL, HTML/CSS, and Figma for UI/UX design.",
    achievements: [
      "Built full-stack web interface from scratch using Flask and JavaScript",
      "Designed intuitive UI/UX using Figma",
      "Implemented database management with SQL for machining data",
    ],
  },
  {
    title: "Industrial Operator",
    company: "Legrand",
    period: "Jul 2022 – Aug 2022",
    description: "Hands-on production work, logistics, and stock organization in a manufacturing environment.",
    achievements: [
      "Contributed to production efficiency and quality control",
      "Managed inventory and logistics operations",
      "Gained practical experience in industrial processes",
    ],
  },
]

export function ExperienceSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="experience" ref={ref} className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            Professional <span className="text-primary glow-text">Experience</span>
          </h2>

          <div className="max-w-4xl mx-auto space-y-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.title + exp.company}
                initial={{ opacity: 0, x: -50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border p-6 md:p-8 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        {exp.title}
                      </h3>
                      <p className="text-primary font-semibold text-lg">{exp.company}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2 md:mt-0">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{exp.period}</span>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 leading-relaxed">{exp.description}</p>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">Key Achievements:</p>
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary mt-1">▹</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
