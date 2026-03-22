pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = 1
        PATH = "${env.HOME}/.bun/bin:${env.PATH}"
        IMAGE_NAME = 'backend-demo'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'checking out the source code from the repository...'
                checkout scm
            }
        }

        stage('Setup Bun') { // setup bun, this is a custom step
            steps {
                sh 'curl -fsSL https://bun.sh/install | bash'
            }
        }

        stage('Install Dependencies') { // install the dependencies, this is a custom step
            steps {
                sh 'bun install --frozen-lockfile'
            }
        }

        stage('Build Application') {
            steps {
                echo '🏗️ building the application...'
                sh 'bun build --compile --minify-whitespace --minify-syntax --outfile server src/index.ts'
            }
        }


        stage('Build Docker Image') {
            steps {
                echo '🏗️ building the docker image...'
                script {
                    def branch = (env.BRANCH_NAME ?: 'unknown').replaceAll('/', '-')
                    def commit = (env.GIT_COMMIT ?: 'nocommit').take(7)
                    env.IMAGE_TAG = "${branch}-${commit}"
                    sh "docker build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG} ."
                }
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    echo '🔑 logging in to docker hub...'
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    script {
                        def fullImage = "${env.DOCKER_USERNAME}/${env.IMAGE_NAME}:${env.IMAGE_TAG}"
                        sh "docker tag ${env.IMAGE_NAME}:${env.IMAGE_TAG} ${fullImage}"
                        sh "docker push ${fullImage}"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '🧹 cleaning up the workspace...'
            deleteDir()
        }
        success {
            echo '✅ build successful...'
        }
        failure {
            echo '❌ build failed...'
        }
    }
}