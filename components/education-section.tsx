"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { GraduationCap, Calendar, MapPin } from "lucide-react"

const education = [
  {
    degree: "Trilingual Master's in Advanced Industrial Technologies",
    school: "ESTIA Engineering School",
    location: "Bidart, France",
    period: "2022 – 2025",
    description: "Comprehensive engineering program with focus on industrial technologies and trilingual education.",
  },
  {
    degree: "Master's in Data Science (MBDS MIAGE)",
    school: "Côte d'Azur University",
    location: "Nice, France",
    period: "2024 – 2025",
    description: "Specialized program in Data Science, Business Intelligence, and Management Information Systems.",
  },
  {
    degree: "Exchange Semester in Information Engineering",
    school: "Imperial University of Hokkaido",
    location: "Hokkaido, Japan",
    period: "2024",
    description: "International exchange program focused on Information Engineering and cross-cultural experience.",
  },
  {
    degree: "TSI Foundation Course",
    school: "Touchard Washington High School",
    location: "Le Mans, France",
    period: "2020 – 2022",
    description: "Preparatory course for engineering schools with focus on technology and industrial sciences.",
  },
]

export function EducationSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="education" ref={ref} className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            <span className="text-primary glow-text">Education</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            International academic background in engineering, data science, and information technology
          </p>

          <div className="max-w-4xl mx-auto space-y-6">
            {education.map((edu, index) => (
              <motion.div
                key={edu.degree + edu.school}
                initial={{ opacity: 0, x: 50 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border p-6 md:p-8 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1 flex items-start gap-2">
                        <GraduationCap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <span>{edu.degree}</span>
                      </h3>
                      <p className="text-primary font-semibold text-lg md:ml-7">{edu.school}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2 md:mt-0 md:ml-4">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm whitespace-nowrap">{edu.period}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground mb-3 md:ml-7">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{edu.location}</span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed md:ml-7">{edu.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
