"use client"

import { motion } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

const projects = [
  {
    title: "ML Resource Prediction System",
    description:
      "Built a production-grade machine learning system at Sophia Genetics that predicts task-level memory usage in bioinformatics pipelines. Implemented ensemble methods with context-aware resource prediction leveraging task sequencing and metadata. Optimized distributed resource allocation, significantly cutting cloud costs and runtime.",
    tags: ["Python", "Machine Learning", "Azure", "ElasticSearch", "GitLab CI/CD"],
    image: "/machine-learning-prediction-dashboard-with-charts-.jpg",
    featured: true,
  },
  {
    title: "Fitness App Prototype",
    description:
      "Full-stack developer for a fitness application project. Designed comprehensive Figma models based on coach requirements and implemented the app prototype in FlutterFlow, delivering a mobile-first solution for fitness tracking and coaching.",
    tags: ["FlutterFlow", "Figma", "UI/UX", "Mobile Development"],
    image: "/fitness-app-workout-tracking.png",
    featured: true,
  },
  {
    title: "Machining Data Management Interface",
    description:
      "Created a full-stack web interface at The Guill Corp to manage machining programming data. Designed and implemented the solution from scratch, streamlining data management workflows for manufacturing operations.",
    tags: ["Python", "Flask", "JavaScript", "SQL", "Figma"],
    image: "/industrial-data-management-dashboard-interface.jpg",
    featured: false,
  },
]

export function ProjectsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <section id="projects" ref={ref} className="py-20 md:py-32 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Featured <span className="text-primary glow-text">Projects</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Real-world applications of machine learning, cloud computing, and full-stack development
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={project.featured ? "lg:col-span-2" : ""}
              >
                <Card className="bg-card/50 backdrop-blur-sm border-border overflow-hidden group hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                  <div className="relative overflow-hidden">
                    <motion.img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-64 object-cover"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent opacity-60" />
                  </div>

                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10 bg-transparent"
                      >
                        <Github className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
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
