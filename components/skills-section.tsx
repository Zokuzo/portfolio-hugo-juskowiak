"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"

const skills = [
  { name: "Python", category: "Language" },
  { name: "TypeScript", category: "Language" },
  { name: "SQL", category: "Database" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "FastAPI", category: "Backend" },
  { name: "Java", category: "Language" },
  { name: "MongoDB", category: "Database" },
  { name: "AWS", category: "Cloud" },
  { name: "Azure", category: "Cloud" },
  { name: "Docker", category: "DevOps" },
  { name: "GitLab CI/CD", category: "DevOps" },
  { name: "XGBoost", category: "ML" },
  { name: "LightGBM", category: "ML" },
  { name: "CatBoost", category: "ML" },
  { name: "Random Forest", category: "ML" },
  { name: "Pandas", category: "Data" },
  { name: "ElasticSearch", category: "Data" },
  { name: "ETL Pipelines", category: "Data" },
]

const categories = [
  { name: "Languages", color: "primary" },
  { name: "Frontend", color: "secondary" },
  { name: "Backend", color: "accent" },
  { name: "ML", color: "primary" },
  { name: "Cloud", color: "secondary" },
  { name: "DevOps", color: "accent" },
  { name: "Data", color: "primary" },
  { name: "Database", color: "secondary" },
]

export function SkillsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="skills" ref={ref} className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Technical <span className="text-primary glow-text">Skills</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Full-stack expertise across modern web technologies, cloud platforms, and machine learning frameworks
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border p-4 text-center hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group cursor-pointer h-full">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                      {skill.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{skill.category}</p>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
